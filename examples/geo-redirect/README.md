[← Back to examples](../README.md)

# Geo Redirect

Redirect incoming requests to a country-specific origin URL based on the client's location.
Uses `getEnv` to read origin URLs from environment variables and `Response.redirect` to issue a
302 redirect.

## How it works

- `BASE_ORIGIN` (required) — the default redirect destination for all clients
- Any additional env var named with a two-letter country code (e.g. `DE`, `US`) overrides the
  destination for clients from that country
- The country code comes from the `geoip-country-code` request header, which FastEdge sets
  automatically from the client's IP

```
GET / (client from DE)  →  302 Location: https://de.example.com/
GET / (client from FR)  →  302 Location: https://default.example.com/  (no FR env var)
GET / (BASE_ORIGIN unset) →  500 BASE_ORIGIN environment variable is not set
```

## APIs used

- `getEnv(name)` from `fastedge::env` — reads environment variables set on the deployed app
- `Response.redirect(url, status)` — Web standard, returns a redirect response
- `request.headers.get('geoip-country-code')` — FastEdge-injected geo header

## Environment variables

| Variable      | Required | Description                                     |
| ------------- | -------- | ----------------------------------------------- |
| `BASE_ORIGIN` | Yes      | Default redirect URL (e.g. `https://example.com/`) |
| `<CC>`        | No       | Per-country URL, where `<CC>` is a 2-letter ISO country code (e.g. `DE`, `US`, `GB`) |

Example configuration:

![env_vars](images/env-vars.png)

## Build

```sh
npm run build
```

Output: `dist/geo-redirect.wasm`

## Testing locally

```sh
# Simulates a client from Germany (FastEdge injects geoip-country-code in production)
curl -H "geoip-country-code: DE" http://localhost:8080/

# No country header — falls back to BASE_ORIGIN
curl http://localhost:8080/
```

Run the local dev server first:

```sh
fastedge-run http -w dist/geo-redirect.wasm --env BASE_ORIGIN=https://default.example.com/ --env DE=https://de.example.com/ --port 8080
```
