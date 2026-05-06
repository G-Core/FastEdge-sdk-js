[← Back to examples](../README.md)

# Bloom Filter — IP Denylist

Rejects requests from IPs present in a KV Store bloom filter. On every request, checks
`event.client.address` against a pre-populated bloom filter and returns **403** on a hit,
**200** otherwise.

Demonstrates `fastedge::kv` `KvStore.open()` + `bfExists()` and the `ClientInfo.address`
surface.

## Configuration

- Environment variable `DENYLIST_STORE` — name of the KV store that holds the bloom filter.
- Bloom-filter key name — hardcoded to `blocked-ips`. Change `BLOOM_KEY` in `src/index.js`
  if your key is different.

## Behaviour

| `bfExists('blocked-ips', ip)` | Response |
| --- | --- |
| `true` | `403` `{ "allowed": false, "ip": "..." }` |
| `false` | `200` `{ "allowed": true, "ip": "..." }` |

## Tradeoff: false positives

Bloom filters answer "**definitely not** in set" vs "**maybe** in set". When `bfExists`
returns `true`, the IP *probably* was added — but a small fraction of hits will be false
positives, meaning some legitimate visitors will be over-blocked. For a denylist this is
usually acceptable; for an allowlist or anything requiring exact membership, use
`KvStore.get()` against a regular key instead.

## Populating the filter

The edge handler is read-only. Populate `blocked-ips` in the configured KV store out of band
— for example via the FastEdge API or the gcore-api-mcp-server.

## Related

Rust equivalent: `FastEdge-sdk-rust/examples/http/wasi/bloom_filter_denylist/`.
