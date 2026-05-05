[← Back to examples](../README.md)

# Cache

Three flagship patterns for the FastEdge POP-local cache, each demonstrating a capability that is hard to build correctly without an in-POP, strongly-consistent byte store.

For the absolute basics (`set` / `get` / `exists` / `delete`), see [cache-basic](../cache-basic/).

## Patterns

### 1. Rate limiting — `?action=rate-limit`

Per-IP request counter with a 60-second fixed window anchored to the first request. Each call increments an atomic counter keyed by `event.client.address`; on the first hit of a window the TTL is attached, so the counter expires 60 seconds after that first request and the next request opens a new window.

```sh
GET /?action=rate-limit
# { count: 1, remaining: 9, ... }

# Repeat 10x within 60s ...
# { error: "Too Many Requests", count: 11 }   (HTTP 429)
```

**Why the cache and not `fastedge::kv`:** atomic `incr` requires strong consistency under concurrent load. The eventually-consistent KV store cannot guarantee a single global count.

### 2. Origin-cache proxy — `?action=proxy&url=...`

Fetches an upstream URL on the first request and caches the response bytes for 30 seconds. Only successful (`response.ok`) responses are cached; non-2xx and redirects flow through unchanged so callers see the real status code instead of a synthetic 200. The pattern uses manual `Cache.get` + conditional `Cache.set` because `getOrSet`'s populator can't signal "fetched, but don't cache" (see Pattern 3 for `getOrSet` with in-process coalescing).

```sh
GET /?action=proxy&url=https://example.com
# First call: fetches example.com, caches body, returns it
# Within 30s: served from cache, no upstream call
```

**What is and isn't preserved:** the response *body* is cached; status and headers are not. The cache is a byte cache, not an HTTP cache. To round-trip headers, encode them into a JSON envelope on write.

### 3. JSON memoisation — `?action=memo`

Generates a small report once, caches the JSON for 60 seconds, and returns it. Refresh the endpoint within the window — the embedded `generatedAt` timestamp stays constant. After 60 seconds it changes.

```sh
GET /?action=memo
# { report: { generatedAt: "...", topItems: [...] } }
```

Use this shape for any expensive synchronous computation: signed-token verification, derived rollups, JSON transformations of slow-changing source data.

## Build

```sh
pnpm install
pnpm run build      # produces dist/cache.wasm
```

The build is configured via `.fastedge/build-config.js` (TypeScript entry point, output path).

## Cache API quick reference

| Method | Purpose |
|---|---|
| `Cache.get(key)` | Read; returns `CacheEntry \| null`. |
| `Cache.set(key, value, options?)` | Write any string / ArrayBuffer / ReadableStream / Response. |
| `Cache.exists(key)` | Cheap presence check. |
| `Cache.delete(key)` | Remove (no-op if absent). |
| `Cache.expire(key, options)` | Set/refresh TTL on an existing key. |
| `Cache.incr(key, delta?)` | Atomic counter increment, returns new value. |
| `Cache.decr(key, delta?)` | Atomic counter decrement. |
| `Cache.getOrSet(key, populate, options?)` | Read or populate-then-write on miss; coalesces concurrent populators. |

`WriteOptions` is one of `{ ttl: seconds }`, `{ ttlMs: milliseconds }`, `{ expiresAt: unixSeconds }`, or `{}` for no expiry.

## Notes

- **POP-local:** values written in one data center are not visible to another. For globally-replicated, eventually-consistent storage use [`fastedge::kv`](../kv-store/).
- **Coalescing scope:** `getOrSet` deduplicates populator runs *within one WASM instance*. Other workers in the same POP race independently.
- **Strong typing:** import types from `fastedge::cache` (`CacheValue`, `CacheEntry`, `WriteOptions`) for compile-time safety on the populator signature.
