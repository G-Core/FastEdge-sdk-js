[← Back to examples](../README.md)

# Cache Basic

The simplest cache example — `set`, `get`, `exists`, and `delete` against the FastEdge POP-local cache, driven by URL query parameters.

## Try it

After deploying the wasm to a FastEdge app, call each action in turn:

```sh
GET /?action=set&key=greeting&value=hello   # Stores "greeting" with a 60s TTL
GET /?action=get&key=greeting               # { hit: true, value: "hello" }
GET /?action=exists&key=greeting            # { present: true }
GET /?action=delete&key=greeting            # { deleted: true }
GET /?action=get&key=greeting               # { hit: false }
```

Wait 60 seconds between `set` and `get` to see TTL expiry produce a miss.

## What this demonstrates

- `Cache.set(key, value, { ttl })` — write a value with an optional expiry
- `Cache.get(key)` — read a value, returns `null` on miss or expiry
- `CacheEntry.text()` — decode the cached bytes as a UTF-8 string
- `Cache.exists(key)` — cheap presence check that does not transfer the value
- `Cache.delete(key)` — remove an entry (no-op if absent)

For atomic counters (`incr` / `decr`), the `getOrSet` populate-on-miss pattern, and rate-limiting / origin-cache examples, see [cache](../cache/).

## Notes

The cache is **strongly consistent within a POP** but **not replicated between POPs** — a value written in one data center is not visible to another. For globally-replicated key/value storage, use [`fastedge::kv`](../kv-store/).
