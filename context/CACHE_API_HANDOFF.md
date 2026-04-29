# Cache API — Implementation Notes

**Status:** All C++ + JS API surface implemented and building cleanly. Awaiting manual verification, integration tests, and an example app.

**Branch:** `feature/cache-api`
**Sibling exploration branch:** `feature/cache-api-async` (DO NOT MERGE — kept for reference; preview-3 async exploration only).

## What this is

A new `fastedge::cache` module surfacing the FastEdge POP-local cache that the runtime team has added to the WIT. Positioned alongside `fastedge::kv`:

- **`fastedge::kv`** — globally replicated, eventually consistent, Redis-shaped key/value store with `scan` / `zrange` / bloom filters. Reads are fast (Redis colocated to every edge); writes are slow (cross-region propagation).
- **`fastedge::cache`** (new) — data-center-scoped, strongly consistent within a single POP, fast reads *and* writes. Includes atomic `incr` so it can be used for rate limiting and other counter primitives that the eventually-consistent KV cannot do reliably. Future work may layer Request/Response Cache-API semantics on top of this byte cache.

## What is implemented

### WIT submodule + bindings

- `runtime/FastEdge-wit` bumped to `b6fdc9f73`. Adds `cache.wit` (async), `cache-sync.wit` (sync, identical surface), `cache-types.wit`, `utils.wit`, plus updated `world.wit`.
- `merge-wit-bindings.js` extended to strip the async `cache` interface from the merged world. Reason: async uses WIT's `async func` syntax which compiles to component-model preview-3 ABI (subtask handles, waitable sets, etc.). Our pinned `wit-bindgen-cli@0.37.0` cannot parse `async func`. StarlingMonkey has no integration for preview-3 either. Async is deferred until the runtime team confirms preview-3 canonicals are enabled in production AND the StarlingMonkey integration is built. See `feature/cache-api-async` for an exploration of what async output looks like (regenerated with `wit-bindgen-cli@0.57.1`).
- `cache-sync` and `utils` are now in `runtime/fastedge/host-api/bindings/bindings.h` as plain `extern bool gcore_fastedge_cache_sync_*(...)` symbols, structurally identical to the existing `gcore_fastedge_key_value_*` symbols.

### Public TypeScript API

- `types/fastedge-cache.d.ts` — full API contract with JSDoc, all methods Promise-returning.
- `types/index.d.ts` — references the new file.
- `pnpm run typecheck` passes.

### Layer 1: Host-API wrappers

In `runtime/fastedge/host-api/`:

- **`include/fastedge_host_api.h`** — adds `CacheResult<T>`, `CacheOption<T>`, `CacheError`, `CacheBytes`, `CacheBytesView` types (parallel to `KvStore*` templates — see "future cleanup" below), plus declarations for the six cache wrappers and `utils_set_user_diag`.
- **`fastedge_host_api.cpp`** — implementations. Mechanical translation from the C bindings, follows the existing `kv_store_*` pattern exactly. `cache_set` / `cache_delete` return `std::optional<CacheError>` (none = success) since the host functions have void result types. Other functions return `CacheResult<T>`.

Confirmed compilation produces correct C++ symbols and correctly references all `gcore_fastedge_cache_sync_*` and `gcore_fastedge_utils_*` C imports.

### Layer 2: Cache builtin

`runtime/fastedge/builtins/cache.cpp` (~1100 lines, single file). Pure C++; no embedded JS shim. Structure:

| Component | Description |
|---|---|
| `Cache` class | Static methods: `get`, `exists`, `set`, `delete`, `expire`, `incr`, `decr`, `getOrSet`. Plus six private Promise reaction handlers for the async coercion paths in `set` and `getOrSet`. |
| `CacheEntry` class | Body-like wrapper with `arrayBuffer()`, `text()`, `json()` — all Promise-returning. Stores bytes via a Uint8Array in a reserved slot (no manual finalization needed). |
| `INFLIGHT_MAP` | Module-static `JS::PersistentRooted<JSObject*>` for `getOrSet` coalescing. No-prototype JSObject so user keys cannot collide with inherited names like `"constructor"`. Initialised in `install()`. |
| `resolve_with` | Convenience helper — wraps a value in a resolved Promise and sets `args.rval()`. Mirrors `ReturnPromiseRejectedWithPendingError` from `builtin.h`. |
| `build_ttl_ms` | Validates `WriteOptions`, enforces mutual exclusion of `ttl` / `ttlMs` / `expiresAt`, translates everything to milliseconds. Used by `set`, `expire`, `getOrSet`. |
| `try_sync_coerce_bytes` | Sync coercion path for string / ArrayBuffer / ArrayBufferView. Used by `set` and `getOrSet`. |
| `finish_set` | Common cache-set + outer-Promise resolution path used by `set`'s sync and async paths. |
| `getOrSet_finalize` | Common cache-set + CacheEntry construction + outer-Promise resolution + inflight cleanup, used by `getOrSet`'s sync and async paths. |
| `reject_and_finish` | Cleanup helper for getOrSet error paths: capture pending exception, reject outer Promise, remove from inflight, clear `args.rval()`. |

Async patterns: when `set` or `getOrSet` receives a `Response` / `ReadableStream` / anything with `.arrayBuffer()`, the C++ uses `JS::Call(cx, value_obj, "arrayBuffer", ...)` to get a `Promise<ArrayBuffer>`, then `JS::AddPromiseReactions(cx, inner, then_h, catch_h)` with `create_internal_method<Cache::*_then>` from `runtime/StarlingMonkey/include/builtin.h:335`. The reaction handlers are static class members so their addresses can be passed as template arguments (free functions in anonymous namespaces cannot be).

### Layer 3: CMake registration

`runtime/fastedge/CMakeLists.txt` — added `add_builtin(fastedge::cache SRC builtins/cache.cpp)`. The build system auto-discovers and registers the namespace via `runtime/fastedge/build-debug/starling-raw.wasm/builtins.incl` (generated, not tracked).

### Layer 4: Module import resolution

`src/componentize/es-bundle.ts` — extended the `fastedge::*` esbuild plugin with a case for `'cache'` returning `export const Cache = globalThis.Cache;`. Same pattern the existing `fastedge::kv` import already uses.

## API design summary

All methods are static and Promise-returning. `Cache` is never constructed.

| Method | Signature |
|---|---|
| `get(key)` | `(string) → Promise<CacheEntry \| null>` |
| `exists(key)` | `(string) → Promise<boolean>` |
| `set(key, value, options?)` | `(string, CacheValue, WriteOptions?) → Promise<void>` |
| `delete(key)` | `(string) → Promise<void>` |
| `expire(key, options)` | `(string, WriteOptions) → Promise<boolean>` (false if missing) |
| `incr(key, delta?)` | `(string, number?) → Promise<number>` (default delta = 1) |
| `decr(key, delta?)` | `(string, number?) → Promise<number>` (sugar over `incr(-delta)`) |
| `getOrSet(key, populate, options?)` | `(string, () => CacheValue \| Promise<CacheValue>, WriteOptions?) → Promise<CacheEntry>` |

`CacheValue = string | ArrayBuffer | ArrayBufferView | ReadableStream | Response`

`CacheEntry` exposes `arrayBuffer(): Promise<ArrayBuffer>`, `text(): Promise<string>`, `json(): Promise<unknown>`.

`WriteOptions` is `{ ttl?: number } | { ttlMs?: number } | { expiresAt?: number } | {}` with mutual exclusion enforced at runtime.

## Key design decisions

### All-async surface (decided 2026-04-29)

Initial design had reads/counters as sync and `set`/`getOrSet` as async (since those needed body collection). Refactored mid-implementation to make every method Promise-returning, including `get` / `exists` / `delete` / `expire` / `incr` / `decr`.

**Why:** the `cache.wit` interface is async-first; `cache-sync` exists only as a toolchain fallback. When wit-bindgen + StarlingMonkey gain preview-3 async support, we want to switch to the async host calls without forcing customers to migrate `count = Cache.incr(k)` → `count = await Cache.incr(k)`. With the all-async surface today, swapping the host implementation is invisible to user code.

Cost is negligible: each method ends with `JS::CallOriginalPromiseResolve(...)` instead of setting `args.rval()` directly. Validation errors still throw synchronously (caught by `await` the same way as a rejection).

### Pure C++ builtin, no embedded JS

StarlingMonkey itself ships every builtin in pure C++ (`blob.cpp`, `url.cpp`, `console.cpp`, etc.). There is no `.js`-embedded-as-C-string pattern anywhere in the upstream tree, no CMake helper for it, no `js2c.py`-style build step. Existing FastEdge builtins are also all-C++. Embedding JS source would establish a brand-new pattern; not worth it for the size of shim we'd save. Reference templates for unfamiliar patterns:
- Body-like Promise-returning methods → `runtime/StarlingMonkey/builtins/web/blob.cpp`.
- Promise reactions from C++ → `runtime/StarlingMonkey/builtins/web/fetch/request-response.cpp`.

There's also a JS-runtime-perf argument: SpiderMonkey-on-WASM lacks its top-tier JIT (Ion/Warp need runtime code generation, which WASM doesn't allow). JS in builtins runs at interpreter or baseline-compiler speed; native WASM C++ runs at full LLVM-AOT speed. Builtin code on every request's hot path matters more than user code where JIT amortisation works.

### Body-like `CacheEntry` return from `get`

Diverges from `KvStore`'s raw `ArrayBuffer | null` return — deliberate ergonomics improvement. Most cache use ends in `JSON.parse(decode(bytes))`; the wrapper removes the boilerplate. Body methods are Promise-returning to match the standard Web `Body` shape, even though we resolve synchronously today; this leaves room for streaming when the WIT supports it.

### `WriteOptions` mutual exclusion

`ttl` (seconds) / `ttlMs` (milliseconds) / `expiresAt` (Unix epoch seconds) are mutually exclusive — `build_ttl_ms` throws `TypeError` if more than one is set, or if a value is non-finite or non-positive. Empty options bag = no expiry. The TTL knobs match the conventional cache-API unit (seconds) plus host-native ms granularity for sub-second cases plus an absolute-time form for "expire at midnight" patterns.

### `getOrSet` coalescing

Implemented in C++ via a module-static no-prototype JSObject (`INFLIGHT_MAP`). Concurrent callers for the same key in the same WASM instance share one populator execution; the inserter is not re-run for joiners. **Coalescing scope is in-process only** — concurrent requests handled by other WASM instances or other POPs race independently. For a POP-local cache that's the honest guarantee. Documented in the JSDoc.

`getOrSet`'s populator returns the `CacheValue` directly (TTL goes in the call-site `options` bag, not in the populator's return). The dynamic-TTL pattern (TTL derived from populator output) is not supported in v1 — see "future work" below.

### `Response` accepted as a write value

Status and headers are discarded; only `await response.arrayBuffer()` is stored. The cache is a byte cache, not an HTTP cache. The future HTTP Cache-API layer is a separate piece of work that would key by Request and serialise full Response (likely as JSON envelope or via a separate WIT).

### `incr` returns Number

WIT host returns `s64`; we surface as JS `Number` for ergonomics (BigInt return would force `> 100n` everywhere — bad DX). Values above `Number.MAX_SAFE_INTEGER` (2^53 − 1) are not represented exactly. Practically unreachable for typical counter use cases. Documented in JSDoc.

## Future cleanup / extension

These are deliberate punts, not bugs. Each is purely additive — no breaking change from v1 to do them later.

### Generalise host-result types (small refactor)

`KvStoreResult<T>` / `KvStoreOption<T>` / `KvStoreError` and the parallel `CacheResult<T>` / `CacheOption<T>` / `CacheError` are not actually domain-specific. A small follow-up PR after cache ships should:
- Rename `KvStoreResult` → `HostResult`, etc.
- Update existing kv-store call sites (one file: `kv-store.cpp` plus the host-api header).
- Drop the parallel `Cache*` types in favour of the shared generics.

5-minute change once both shipping forms are in tree.

### Async WIT (when toolchain supports preview-3)

When wit-bindgen gains stable preview-3 async support AND StarlingMonkey gains the subtask/waitable-set integration, switch the host calls from `gcore_fastedge_cache_sync_*` to the async `gcore_fastedge_cache_*`. The JS surface is already Promise-returning; users see no change. See `feature/cache-api-async` for what the async C surface looks like.

### Dynamic TTL for `getOrSet`

If a real customer use case emerges for "TTL derived from populator output" (e.g. honour `Cache-Control: max-age=N` from an upstream Response), the *additive* extension is to allow `options` to also be a function `(value: CacheValue) => WriteOptions`. Backwards-compatible with all existing call sites. Don't do speculatively.

### `utils.set-user-diag` JS surface

The `gcore:fastedge/utils` interface (one function: `set-user-diag(name)`) has its host-api wrapper in place but no JS-facing surface. Decide where it belongs (a new `fastedge::utils` module, or hung off `fastedge::env` as a sibling to `getEnv`), then add the builtin method and TypeScript declarations. Small follow-up.

### HTTP Cache API layer

The byte cache is the foundation. A future `caches` global (or `fastedge::http-cache` module) could layer Service-Worker `CacheStorage` semantics on top: keyed by `Request` (with selected `Vary` headers), values are full `Response` envelopes (status + headers + body), TTL derived from `Cache-Control` parsing. None of that requires changing the v1 byte cache.

## Open questions (need runtime team)

- **`incr` non-integer behaviour.** The JSDoc claims `incr` rejects if the stored value at `key` is not an integer. The WIT only has the generic error variant — confirm with the runtime team that `internal-error` or `other("not an integer")` is what gets returned in that case. Our error path surfaces whatever the host gives; if the host returns generic `internal-error`, the message will say "Internal cache error" rather than something more specific.

## What's left for ship

1. **Manual testing.** Build a cold WASM, deploy to a POP, exercise each method against a real host. The host imports must be answered by the production runtime — none of our host calls are mocked locally.
2. **Integration tests.** `integration-tests/` template is the existing kv-store flow. Need cache-flow tests covering: round-trip set/get, TTL expiry, atomic incr (concurrent), getOrSet coalescing, error propagation, all `CacheValue` input types.
3. **Example app.** `examples/cache/` demonstrating the API. Rate-limit + getOrSet (origin-cache proxy) cover the two highest-value patterns.
4. **PR / review.** The branch has 4+ commits; squash or keep as-is for review depending on team convention.

## How to verify

1. **Build the runtime in debug mode**: `pnpm run build:monkey:dev`. Should produce `lib/fastedge-runtime.wasm`.
2. **Inspect symbols**: `/opt/wasi-sdk/bin/llvm-nm runtime/fastedge/build-debug/CMakeFiles/builtin_fastedge_cache.dir/builtins/cache.cpp.obj | grep -E "Cache|getOrSet"` — should show all eight methods plus the four reaction handlers.
3. **Confirm the WIT host imports**: `grep gcore_fastedge_cache_sync runtime/fastedge/host-api/bindings/bindings.h` — all six imports should be present.
4. **Typecheck the public API**: `pnpm run typecheck`.
5. **Build a tiny WASM via fastedge-build with a cache import**: smoke-tests the esbuild plugin path.

## Reference: file map

| File | Role |
|---|---|
| `runtime/FastEdge-wit/` (submodule @ `b6fdc9f`) | Source-of-truth WIT |
| `runtime/fastedge/scripts/merge-wit-bindings.js` | Strips async `cache`; merges sync into host-api/wit |
| `runtime/fastedge/host-api/bindings/bindings.{h,c}` | Generated C bindings (don't edit) |
| `runtime/fastedge/host-api/include/fastedge_host_api.h` | Layer 1 — C++ types + declarations |
| `runtime/fastedge/host-api/fastedge_host_api.cpp` | Layer 1 — C++ wrappers |
| `runtime/fastedge/builtins/cache.cpp` | Layer 2 — JS-facing builtin |
| `runtime/fastedge/CMakeLists.txt` | Builtin registration |
| `src/componentize/es-bundle.ts` | esbuild plugin: `fastedge::cache` import resolution |
| `types/fastedge-cache.d.ts` | Public TS contract |
| `types/index.d.ts` | Type entrypoint reference |

## Memory

- `wit-bindgen-cli@0.37.0` is the pinned version. Install with `cargo install --locked wit-bindgen-cli@0.37.0` if regenerating bindings.
- **Never** reference Fastly / Cloudflare / Redis / Memcached etc. in any user-facing artifact (JSDoc, READMEs, examples, generated docs). Internal design discussion only.
