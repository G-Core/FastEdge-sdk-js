# FastEdge JS Examples

JavaScript examples for building HTTP applications on the [FastEdge](https://gcore.com/fastedge)
network using
[`@gcoredev/fastedge-sdk-js`](https://www.npmjs.com/package/@gcoredev/fastedge-sdk-js).

## Getting Started Examples

| Example                                                     | Description                                        |
| ----------------------------------------------------------- | -------------------------------------------------- |
| [hello-world](./hello-world/)                               | Simplest request handler — returns the request URL |
| [downstream-fetch](./downstream-fetch/)                     | Fetch from a downstream HTTP origin                |
| [downstream-modify-response](./downstream-modify-response/) | Fetch downstream and transform the response        |
| [headers](./headers/)                                       | Header manipulation using environment variables    |
| [kv-store-basic](./kv-store-basic/)                         | Simple KV Store get operation                      |
| [cache-basic](./cache-basic/)                               | Simple POP-local cache set/get/exists/delete       |
| [variables-and-secrets](./variables-and-secrets/)           | Read environment variables and secrets             |

## Full Examples

| Example                                                       | Description                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [ab-testing](./ab-testing/)                                   | Cookie-based A/B testing — assigns weighted variants to returning users               |
| [geo-redirect](./geo-redirect/)                               | Redirect requests by country code using env vars                                      |
| [kv-store](./kv-store/)                                       | Query a KV Store via URL params — get/scan/zrange/zscan/bfExists                      |
| [cache](./cache/)                                             | POP-local cache patterns — per-IP rate limiting, origin-cache proxy, JSON memoisation |
| [template-invoice](./template-invoice/)                       | HTML invoice rendered server-side using Handlebars templates                          |
| [template-invoice-ab-testing](./template-invoice-ab-testing/) | Template invoice with logo and font variants driven by A/B test headers               |
| [static-assets](./static-assets/)                             | Serve static assets (images, styles, templates) embedded in the wasm binary with Hono |
| [mcp-server](./mcp-server/)                                   | MCP server running on FastEdge — weather alerts and forecast via NWS API              |

## Usage

Each example is a standalone project. To run one:

```sh
cd <example-name>
pnpm install
pnpm run build
```

Each example installs `@gcoredev/fastedge-sdk-js` from npm, which includes the `fastedge-build` CLI.
