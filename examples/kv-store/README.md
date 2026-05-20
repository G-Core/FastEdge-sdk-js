[← Back to examples](../README.md)

# KV Store

Demonstrates all five KV Store read operations via HTTP query parameters: `get`, `scan`, `zrange`,
`zscan`, and `bfExists`. All responses are `application/json`.

For the simplest possible KV example, see [kv-store-basic](../kv-store-basic/).

## Query Parameters

| Parameter | Required for              | Description                                                         |
| --------- | ------------------------- | ------------------------------------------------------------------- |
| `store`   | all actions               | Name of the KV store bound to the app                               |
| `action`  | all (default: `get`)      | One of: `get`, `scan`, `zrange`, `zscan`, `bfExists`                |
| `key`     | `get`, `zrange`, `zscan`, `bfExists` | Key to look up in the store                              |
| `match`   | `scan`, `zscan`           | Prefix match pattern, must include a wildcard (e.g. `foo*`)         |
| `min`/`max` | `zrange`                | Score range bounds (numeric)                                        |
| `item`    | `bfExists`                | Item to test for existence in the Bloom filter at `key`             |

## KV Store API reference

| Method                            | Returns               | Description                                                  |
| --------------------------------- | --------------------- | ------------------------------------------------------------ |
| `KvStore.open(name)`              | `KvStore`             | Opens the named store bound to the app                       |
| `store.get(key)`                  | `ArrayBuffer \| null` | Reads raw bytes at `key`; `null` on miss                     |
| `store.scan(match)`               | `string[]`            | Lists all keys matching the glob pattern                     |
| `store.zrangeByScore(key, min, max)` | `[value, score][]` | Returns sorted-set members in the score range `[min, max]`   |
| `store.zscan(key, match)`         | `[value, score][]`    | Returns sorted-set members whose values match the pattern    |
| `store.bfExists(key, item)`       | `boolean`             | Tests whether `item` is probably in the Bloom filter at `key`|

## Build

```sh
npm run build
```

Uses `fastedge-build -c` (config-driven build). Output is defined in `.fastedge/build-config.js`.

## Example requests

```sh
# Get a value by key
curl "https://<app>.fastedge.app/?store=my-store&action=get&key=hello"

# Scan all keys with prefix "user:"
curl "https://<app>.fastedge.app/?store=my-store&action=scan&match=user:*"

# Range query on a sorted set (scores 0–100)
curl "https://<app>.fastedge.app/?store=my-store&action=zrange&key=leaderboard&min=0&max=100"

# Bloom filter membership test
curl "https://<app>.fastedge.app/?store=my-store&action=bfExists&key=denylist&item=192.168.1.1"
```

Example response:

```json
{
  "Store": "my-store",
  "Action": "get",
  "Key": "hello",
  "Response": "world"
}
```
