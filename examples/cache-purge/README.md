[← Back to examples](../README.md)

# Cache Purge

Bulk cache invalidation using `Cache.purge` and `Cache.purgePrefix` — two operations that remove large sets of keys at once without needing to know every individual key name.

## Try it

Run the three actions in sequence after deploying the wasm:

```sh
# 1. Populate the cache with keys across two namespaces
GET /?action=seed
# → { "action": "seed", "seeded": 5 }

# 2. Invalidate only the user: keys (leaves product: keys intact)
GET /?action=purge-prefix&prefix=user:
# → { "action": "purge-prefix", "prefix": "user:", "purged": 3 }

# 3. Wipe all remaining keys
GET /?action=purge
# → { "action": "purge", "purged": 2 }
```

## What this demonstrates

- `Cache.purgePrefix(prefix)` — delete all keys beginning with a prefix; resolves with the count deleted
- `Cache.purge()` — delete every key owned by this application; resolves with the count deleted

For single-key operations (`set`, `get`, `exists`, `delete`), see [cache-basic](../cache-basic/).
For atomic counters, `getOrSet`, and rate-limiting patterns, see [cache](../cache/).

## Notes

Both purge operations affect **only this application's keys** — they cannot reach another application's cache entries.

The cache is **strongly consistent within a POP** but **not replicated between POPs**. Purging in one data center does not affect cached values in another. For globally-replicated key/value storage, use [`fastedge::kv`](../kv-store/).
