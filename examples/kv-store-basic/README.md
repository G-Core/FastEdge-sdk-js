[← Back to examples](../README.md)

# KV Store Basic

The simplest KV Store example — open a named store and get a value by key.

For a more complete example demonstrating all KV operations (get, scan, zrange, zscan, bfExists), see [kv-store](../kv-store/).

## How it works

Opens a KV store (named at deploy time via the app's store binding), reads the entry at a hardcoded
key, and returns its text value. Returns `404` if the key is not found.

```
GET /  →  200  "The KV Store responded with: <value>"
GET /  →  404  "Key not found"        (key absent from store)
GET /  →  500  { "error": "..." }     (store not bound or host error)
```

## APIs used

- `KvStore` from `fastedge::kv` — opens a named KV store bound to the app
- `store.getEntry(key)` — reads a single entry; returns `null` on miss
- `entry.text()` — decodes the stored bytes as a UTF-8 string

## Store binding

The store name in the source (`'kv-store-name-as-defined-on-app'`) must match the name of a KV
store you have created and bound to your FastEdge app in the Gcore portal. Replace this string with
your actual store name before deploying.

## Build

```sh
npm run build
```

Output: `dist/kv-store-basic.wasm`
