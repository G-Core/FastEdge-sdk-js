[← Back to examples](../README.md)

# Outbound Fetch

Make an outbound HTTP request from a FastEdge worker and stream the response back to the caller.
Demonstrates that the standard Web `fetch()` API works inside FastEdge — no special SDK import
needed.

## How it works

Every incoming request triggers an outbound `fetch` to the
[JSONPlaceholder](https://jsonplaceholder.typicode.com) `/users` endpoint. The upstream response
is returned directly — status, headers, and body are streamed through unchanged.

```
GET /  →  200 (upstream response from jsonplaceholder.typicode.com/users)
```

## APIs used

- `fetch(url)` — Web standard, available globally in FastEdge workers

## Build

```sh
npm run build
```

Output: `dist/outbound-fetch.wasm`

## Expected output

```json
[
  { "id": 1, "name": "Leanne Graham", "username": "Bret", "email": "Sincere@april.biz", ... },
  { "id": 2, "name": "Ervin Howell",  "username": "Antonette", ... },
  ...
]
```

The response is a JSON array of 10 user objects from JSONPlaceholder.
