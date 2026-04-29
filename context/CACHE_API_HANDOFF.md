# Cache API — In-progress Handoff

**Status:** API design landed. C++ wiring not started. Resumable.
**Branch:** `feature/cache-api`
**Sibling exploration branch:** `feature/cache-api-async` (DO NOT MERGE — kept for reference).

## What this is

A new `fastedge::cache` module surfacing the FastEdge POP-local cache that the runtime team has added to the WIT. It is positioned as a sibling to `fastedge::kv`:

- **`fastedge::kv`** — globally replicated, eventually consistent, Redis-shaped key/value store with `scan` / `zrange` / bloom filters. Reads are fast (Redis colocated to every edge); writes are slow (cross-region propagation).
- **`fastedge::cache`** (new) — data-center-scoped, strongly consistent within a single POP, fast reads *and* writes. Includes atomic `incr` so it can be used for rate limiting and other counter primitives that the eventually-consistent KV cannot do reliably. Future work may layer Request/Response Cache-API semantics on top of this byte cache.

## What is already done

### WIT submodule + bindings (commits `31322c9`, `b207bed`)

- `runtime/FastEdge-wit` bumped to `b6fdc9f73`. Adds `cache.wit` (async), `cache-sync.wit` (sync, identical surface), `cache-types.wit`, `utils.wit`, plus updated `world.wit`.
- `merge-wit-bindings.js` extended to strip `cache` (the async variant) from the merged world. Reason: async uses WIT's `async func` syntax which compiles to component-model preview-3 ABI (subtask handles, waitable sets, etc.). Our pinned `wit-bindgen-cli@0.37.0` cannot parse `async func`. StarlingMonkey has no integration for preview-3 either. Async is deferred until the runtime team confirms preview-3 canonicals are enabled in production AND the StarlingMonkey integration is built. See `feature/cache-api-async` for an exploration of what async output looks like (regenerated with `wit-bindgen-cli@0.57.1`).
- `cache-sync` and `utils` are now visible in `runtime/fastedge/host-api/bindings/bindings.h` as plain `extern bool gcore_fastedge_cache_sync_*(...)` symbols, structurally identical to the existing `gcore_fastedge_key_value_*` symbols.

Generated symbols to wrap (in `bindings.h`):

```c
extern bool gcore_fastedge_cache_sync_get(bindings_string_t *key, bindings_option_payload_t *ret, gcore_fastedge_cache_sync_error_t *err);
extern bool gcore_fastedge_cache_sync_set(bindings_string_t *key, gcore_fastedge_cache_sync_payload_t *value, uint64_t *maybe_ttl_ms, gcore_fastedge_cache_sync_error_t *err);
extern bool gcore_fastedge_cache_sync_delete(bindings_string_t *key, gcore_fastedge_cache_sync_error_t *err);
extern bool gcore_fastedge_cache_sync_exists(bindings_string_t *key, bool *ret, gcore_fastedge_cache_sync_error_t *err);
extern bool gcore_fastedge_cache_sync_incr(bindings_string_t *key, int64_t delta, int64_t *ret, gcore_fastedge_cache_sync_error_t *err);
extern bool gcore_fastedge_cache_sync_expire(bindings_string_t *key, uint64_t ttl_ms, bool *ret, gcore_fastedge_cache_sync_error_t *err);
extern void gcore_fastedge_utils_set_user_diag(bindings_string_t *name);
```

Errors variant: `access-denied`, `internal-error`, `other(string)` — same shape as the existing `key-value` errors.

Note the `option<u64>` for ttl-ms maps to `uint64_t *maybe_ttl_ms` — pass `NULL` for "no TTL".

### Public TypeScript API (committed alongside this doc)

- `types/fastedge-cache.d.ts` — full API contract with JSDoc.
- `types/index.d.ts` — references the new file.
- `pnpm run typecheck` passes.

## API design summary

Static `Cache` class on `fastedge::cache`. Methods:

| Method | Signature | Sync / async |
|---|---|---|
| `get(key)` | `(string) → CacheEntry \| null` | sync |
| `exists(key)` | `(string) → boolean` | sync |
| `set(key, value, options?)` | `(string, CacheValue, WriteOptions?) → Promise<void>` | **async** |
| `delete(key)` | `(string) → void` | sync |
| `expire(key, options)` | `(string, WriteOptions) → boolean` | sync — false if missing |
| `incr(key, delta?)` | `(string, number?) → number` | sync — defaults `delta=1` |
| `decr(key, delta?)` | `(string, number?) → number` | sync — sugar for `incr(-delta)` |
| `getOrSet(key, populate, options?)` | `(string, () => CacheValue \| Promise<CacheValue>, WriteOptions?) → Promise<CacheEntry>` | **async**, JS-side coalescing |

Design decisions worth recalling:

- **`set` is async** because it accepts `Response` and `ReadableStream` (must be collected before the host call). Reads / counters stay sync — the underlying host call is sync, and that matches the existing `KvStore` precedent.
- **`get` returns a `CacheEntry`** (Body-like with `arrayBuffer()`, `text()`, `json()` — all `Promise<T>` to match the standard Web `Body` shape). Diverges from `KvStore`'s raw-bytes return; deliberate ergonomics improvement on the new surface.
- **TTL outside the populator** in `getOrSet`. Shape is `getOrSet(key, () => fetch(...), { ttl: 5 })`. The dynamic-TTL case (TTL derived from populator output) is **not** supported in v1 — see "Open questions" below.
- **`WriteOptions`** is a flat options bag with optional `ttl` (seconds), `ttlMs`, `expiresAt` (Unix epoch seconds). Mutually exclusive at runtime — the builtin must throw `TypeError` if more than one is set. WIT takes `ttl-ms`, so the JS layer translates: `ttlMs` direct, `ttl × 1000`, `(expiresAt × 1000) − Date.now()`.
- **Strings are UTF-8 encoded**. The cache stores raw bytes only; no type marker. Readers decode via the `CacheEntry` accessor that fits.
- **`Response` accepted as a write value**; status and headers are discarded (this is a byte cache, not an HTTP cache). The future HTTP Cache-API layer is a separate piece of work that would key by Request and serialise full Response.
- **Errors throw** as plain JS `Error` objects with descriptive messages. Same pattern as `KvStore` builtin.
- **`getOrSet` coalescing is in-process only.** Concurrent requests on the same WASM instance share one `populate` execution; concurrent requests on other instances or POPs race independently. Documented in the JSDoc.

## What remains — C++ wiring

### Layer 1: Host-API wrappers

**Files:** `runtime/fastedge/host-api/fastedge_host_api.cpp` + `include/fastedge_host_api.h`.

Add C++ wrappers around the new C bindings, mirroring the existing `kv_store_*` pattern. The `KvStoreResult<T>` / `KvStoreOption<T>` templates are reusable — either rename to `HostResult<T>` / `HostOption<T>` (worth doing — they're not KV-specific, and the cache bindings will reuse them) or just parallel them as `CacheResult<T>` if you don't want to refactor existing call sites.

Functions to add:

```cpp
HostResult<HostOption<HostBytes>> cache_get(std::string_view key);
HostResult<void> cache_set(std::string_view key, ByteSpan value, std::optional<uint64_t> ttl_ms);
HostResult<void> cache_delete(std::string_view key);
HostResult<bool> cache_exists(std::string_view key);
HostResult<int64_t> cache_incr(std::string_view key, int64_t delta);
HostResult<bool> cache_expire(std::string_view key, uint64_t ttl_ms);

void utils_set_user_diag(std::string_view name);
```

Use `host_api::fastedge_host_api.cpp`'s existing `to_host_string` / `string_view_to_world_string` helpers; the patterns map 1:1.

### Layer 2: Builtin

**Files:** `runtime/fastedge/builtins/cache.cpp` + `cache.h`. Closest existing template: `runtime/fastedge/builtins/kv-store.cpp`.

The builtin is *simpler* than `KvStore`:
- No `open(name)` static factory — single global, no resource handle.
- No instance — just static methods on the `Cache` class.
- No reserved slots — nothing to finalise.

The shape:

```cpp
class Cache : public builtins::BuiltinNoConstructor<Cache> {
public:
  static constexpr const char *class_name = "Cache";

  static bool get(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool exists(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool set(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool delete_(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool expire(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool incr(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool decr(JSContext *cx, unsigned argc, JS::Value *vp);

  // getOrSet is installed via JS source string in install(); not a C++ method.
  static bool install(api::Engine *engine);

  static const JSClass class_;
  static const JSFunctionSpec static_methods[];
};
```

`install()` should:

1. Create a `Cache` constructor object with the static methods defined above.
2. Compile and execute a JS string that:
   - Defines `coerceToBytes`, `makeCacheEntry`, and the in-flight `Map`.
   - Adds `Cache.getOrSet` as a property on the constructor.
   - Wraps `Cache.get` so it returns a `CacheEntry` (the C++ method should return a `Uint8Array`-like result; the JS shim wraps it).
   - Wraps `Cache.set` so it accepts `string | ArrayBuffer | ArrayBufferView | ReadableStream | Response`, coerces to bytes via `coerceToBytes`, then calls the underlying C++ method (which can take a `Uint8Array` directly).
3. Register the module via `engine->define_builtin_module("fastedge::cache", cache_val)`.

**Open question — implementation of the JS shim:** the existing builtins (e.g. `fastedge.cpp`) install pure-C++ methods directly. There is no current precedent for compiling JS source as part of `install()`. Two options to evaluate:

- **A: JS-as-string in C++.** Embed the shim source as a `static constexpr const char[]` and compile via `JS::Compile` + `JS::CloneAndExecuteScript`. Self-contained but the JS lives in C++ source (awkward to lint/format).
- **B: Separate `.js` file bundled into runtime.** Less ergonomic with the existing build system. Investigate how StarlingMonkey itself ships its built-in JS (the `console`, `URL` etc. polyfills) — there may be a precedent (`runtime/builtins/*.js`) to follow.

Look at `runtime/StarlingMonkey/builtins/` for any embedded JS pattern before choosing.

### Layer 3: CMake registration

**File:** `runtime/fastedge/CMakeLists.txt`. Add:

```cmake
add_builtin(fastedge::cache SRC builtins/cache.cpp)
```

Alongside the existing `add_builtin` calls.

### Layer 4: Tests

- Integration tests in `integration-tests/` exercising end-to-end cache flow.
- Test the `WriteOptions` mutual-exclusion runtime check.
- Test `getOrSet` coalescing with two concurrent inserters (in-process).
- Test that `set` accepts each `CacheValue` shape (string, ArrayBuffer, View, ReadableStream, Response).
- Integration tests need a running runtime — see existing tests for how kv-store is exercised.

## Reference — the JS shim for `getOrSet` (drafted, not committed)

```js
const inflight = new Map(); // string -> Promise<CacheEntry>

async function getOrSet(key, populate, options) {
  const hit = Cache.get(key);
  if (hit !== null) return hit;

  const pending = inflight.get(key);
  if (pending !== undefined) return pending;

  const promise = (async () => {
    try {
      const value = await populate();
      const bytes = await coerceToBytes(value);
      await Cache.set(key, bytes, options);
      return makeCacheEntry(bytes);
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

async function coerceToBytes(value) {
  if (typeof value === 'string') return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof Response) return new Uint8Array(await value.arrayBuffer());
  if (value instanceof ReadableStream) {
    return new Uint8Array(await new Response(value).arrayBuffer());
  }
  throw new TypeError('Unsupported CacheValue type');
}

function makeCacheEntry(bytes) {
  const decode = () => new TextDecoder().decode(bytes);
  return {
    arrayBuffer: () => Promise.resolve(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    ),
    text: () => Promise.resolve(decode()),
    json: () => Promise.resolve(JSON.parse(decode())),
  };
}
```

## Open questions

- **Where does WriteOptions runtime validation live?** Probably in a JS helper called from both `set` and `expire`. The mutual-exclusion check (`ttl` ⊕ `ttlMs` ⊕ `expiresAt`) and the "no zero/negative" check should be one place.
- **`incr` integer-not-an-integer semantics.** The JSDoc claims `incr` "throws if the stored value at `key` is not an integer." The WIT only has the generic error variant — confirm with the runtime team that `internal-error` or `other(string)` is what gets returned in that case, and decide if we want to surface it as `TypeError` specifically.
- **Dynamic-TTL future for `getOrSet`.** Shipped without it. If a customer use case emerges, the *purely additive* extension is to allow `options` to also be a function `(value: CacheValue) => WriteOptions`. That signature change is backwards-compatible with all existing callers. Don't do it speculatively.
- **JS shim install pattern.** See "Layer 2 / Open question" above — investigate StarlingMonkey precedent before choosing A vs B.
- **Response storage scope.** The current contract says status/headers are discarded. If we ever want to evolve this into the future HTTP Cache API, that future API should take `Request` keys and store the full `Response` (likely in a JSON envelope, or via a separate WIT). It does not change any of the v1 byte-cache work.

## How to resume

1. **Read this file.**
2. **Read `types/fastedge-cache.d.ts`** — the contract is the source of truth for the JS surface.
3. **Read `runtime/fastedge/builtins/kv-store.cpp`** as the closest C++ template.
4. **Read `runtime/fastedge/host-api/fastedge_host_api.cpp`** for the host-api wrapper pattern.
5. **Confirm `wit-bindgen-cli@0.37.0` is installed** before any regeneration — see memory.
6. Implement Layer 1 (host-api), then Layer 2 (builtin), then Layer 3 (CMake), then Layer 4 (tests). Commit per layer.
7. **Do not** reference Fastly / Cloudflare / Redis / Memcached etc. in any user-facing artifact (JSDoc, READMEs, examples, generated docs). See memory.
