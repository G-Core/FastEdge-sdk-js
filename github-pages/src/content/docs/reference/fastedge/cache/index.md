---
title: Cache
description: Overview of the FastEdge POP-local cache.
---

### POP-local cache

The `fastedge::cache` module is a fast key/value store scoped to a single point of presence (POP).
Reads and writes are sub-millisecond, and the API exposes atomic counter primitives that make it
suitable for rate limits, quotas, locks, and request coalescing within a POP.

Writes do **not** replicate to other POPs. A value written from one data center is invisible to
another. This is the trade-off that makes the cache fast and strongly consistent locally — and is
the right choice for transient, request-time state. For globally-replicated, eventually-consistent
storage use [`fastedge::kv`](/FastEdge-sdk-js/reference/fastedge/kv/open/).

### When to use Cache vs KV

| Property            | `fastedge::cache`                          | `fastedge::kv`                            |
| ------------------- | ------------------------------------------ | ----------------------------------------- |
| Scope               | One POP                                    | All POPs                                  |
| Consistency         | Strong within a POP                        | Eventual; globally replicated             |
| Atomic counters     | `incr`, `decr`, `getOrSet` coalescing      | Not available                             |
| Persistence         | Evicted; no durability guarantee           | Durable across deployments                |
| Typical use         | Rate limits, counters, response memoising  | Configuration, lookup tables, sorted sets |

### Importing

`Cache` is a static class — never instantiated. Every method returns a `Promise`.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const ip = event.client.address ?? 'unknown';
  const count = await Cache.incr(`rl:${ip}`);
  if (count === 1) await Cache.expire(`rl:${ip}`, { ttl: 60 });
  if (count > 100) {
    return new Response('Too Many Requests', { status: 429 });
  }
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

### WriteOptions

`Cache.set`, `Cache.expire`, and `Cache.getOrSet` accept a `WriteOptions` object controlling expiry.
Pass exactly one of `ttl`, `ttlMs`, or `expiresAt`. Passing more than one — or zero/negative
values — throws `TypeError`. Omit options entirely (or pass `{}`) for no expiry.

| Field       | Unit                  | Description                                          |
| ----------- | --------------------- | ---------------------------------------------------- |
| `ttl`       | seconds from now      | The conventional unit for cache and KV APIs          |
| `ttlMs`     | milliseconds from now | Use for sub-second granularity (short windows)       |
| `expiresAt` | Unix epoch seconds    | Absolute deadline (e.g. "expire at midnight")        |

### CacheValue

`Cache.set` and the `populate` callback of `Cache.getOrSet` accept any `CacheValue`. All forms are
coerced to raw bytes before storage.

```ts
type CacheValue = string | ArrayBuffer | ArrayBufferView | ReadableStream | Response;
```

- `string` — encoded as UTF-8.
- `ArrayBuffer` / `ArrayBufferView` — used directly.
- `ReadableStream` — fully consumed into a single byte buffer.
- `Response` — the body is consumed via `await response.arrayBuffer()`. Status and headers are
  discarded; if you need to round-trip them, encode as a JSON envelope yourself.

### Errors

Operational errors from the host (access denied, internal error) surface as Promise rejections.
Validation errors on call arguments (wrong types, conflicting `WriteOptions` fields) are thrown
synchronously. Both are caught the same way by `try`/`catch` around an `await`.
