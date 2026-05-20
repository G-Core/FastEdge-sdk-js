[← Back to examples](../README.md)

# Outbound Modify Response

Fetch data from an upstream origin, transform the JSON body, and return a new response with custom
headers. Shows how to consume an outbound response as JSON and reshape it before sending it to the
caller.

## How it works

Fetches the full user list from [JSONPlaceholder](https://jsonplaceholder.typicode.com) (`/users`),
slices it to the first 5 entries, wraps it in a pagination envelope, and returns it as
`application/json`.

```
GET /  →  200 application/json  (first 5 users + pagination metadata)
```

## APIs used

- `fetch(url)` — Web standard, outbound HTTP request
- `response.json()` — reads and parses the upstream response body
- `new Response(body, { headers })` — constructs the modified response

## Build

```sh
npm run build
```

Output: `dist/outbound-modify-response.wasm`

## Expected output

```json
{
  "users": [
    { "id": 1, "name": "Leanne Graham", "username": "Bret", "email": "Sincere@april.biz", ... },
    { "id": 2, "name": "Ervin Howell",  "username": "Antonette", ... },
    { "id": 3, ... },
    { "id": 4, ... },
    { "id": 5, ... }
  ],
  "total": 5,
  "skip": 0,
  "limit": 30
}
```
