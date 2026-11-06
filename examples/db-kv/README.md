# Database KV

Per-user rate limit and a visit counter in a Database KV bound to the app as `main`, updated in one
atomic `batch`. Same keys, limits and responses as the Rust `db_kv` example.

Database KV (`fastedge::db/kv`) is regional, durable and writable from the app. It is not Edge
Storage (`fastedge::kv`, read-only) or the POP-local `Cache`.

## Setup

Bind the database: add a secret `FASTEDGE_DB_KV_main` with the Upstash Redis REST URL and token as
`https://<token>@<host>` (e.g. `https://AXXX...@eu1-example-12345.upstash.io`). The app never sees
it; the host resolves `KvDatabase.open("main")`.

## Usage

```
GET /?user=ann  → 200 {"user":"ann","requests":1,"limit":5,"visits":17}
(6th request from ann within 60 s)
GET /?user=ann  → 429 {"error":"rate limited","user":"ann","limit":5}
GET /           → user "anonymous"
```

Each request runs one batch: `set` the user's window counter to `"0"` with a 60 s TTL if it doesn't
exist, `incr` it, `incr` the global `visits` counter. The batch is all-or-nothing.

## Error responses

| Condition | Status | Body |
|---|---|---|
| No database bound to `main` | 500 | `{"error":"no such database"}` |
| A key holds a non-counter value | 500 | `{"error":"…","code":"ERR"}` |

## Build

```sh
npm run build
# Output: dist/db-kv.wasm
```

Local run: `fastedge-run http -w dist/db-kv.wasm --wasi-http true --secret "FASTEDGE_DB_KV_main=https://<token>@<host>"`
