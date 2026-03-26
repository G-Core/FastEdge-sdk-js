# FastEdge JS SDK Documentation

The FastEdge JS SDK (`@gcoredev/fastedge-sdk-js`) is the JavaScript/TypeScript development toolkit for building serverless edge applications on Gcore's FastEdge platform. It compiles your code into WebAssembly components that run on 160+ edge data centers worldwide.

## Package

- **npm:** `@gcoredev/fastedge-sdk-js`
- **Version:** 2.1.0
- **Node:** >= 20
- **License:** Apache-2.0

## CLI Tools

| Tool | Command | Purpose |
|------|---------|---------|
| **fastedge-build** | `npx fastedge-build <input> <output>` | Compile JS/TS to WebAssembly |
| **fastedge-init** | `npx fastedge-init` | Interactive project scaffolding |
| **fastedge-assets** | `npx fastedge-assets <input> <output>` | Generate static asset manifest |

## Documentation

| Document | Description |
|----------|-------------|
| [Quickstart](quickstart.md) | Installation and first build |
| [fastedge-build CLI](BUILD_CLI.md) | Compile JavaScript to WebAssembly |
| [fastedge-init CLI](INIT_CLI.md) | Scaffold a new FastEdge project |
| [fastedge-assets CLI](ASSETS_CLI.md) | Generate static asset manifests |
| [Static Sites](STATIC_SITES.md) | Serve static websites from WASM |
| [SDK Runtime API](SDK_API.md) | Environment, KV Store, Secrets, and Web APIs |

## Application Model

FastEdge apps use the Service Worker API pattern:

```js
async function handler(event) {
  const request = event.request;
  return new Response(`Hello from the edge!`);
}

addEventListener('fetch', (event) => {
  event.respondWith(handler(event));
});
```

The `addEventListener('fetch', ...)` call must be at the top level. The callback must synchronously call `event.respondWith()` with a handler that returns a `Response` (or a `Promise<Response>`).

## Build Types

| Type | Description | CLI |
|------|-------------|-----|
| **HTTP** | Standard request handler | `fastedge-build src/index.js output.wasm` |
| **Static** | Serve static files embedded in WASM | `fastedge-build --config .fastedge/build-config.js` |

## Runtime APIs

Available via special imports inside your WASM application:

| Import | API |
|--------|-----|
| `fastedge::env` | `getEnv(name)` — environment variables |
| `fastedge::secret` | `getSecret(name)`, `getSecretEffectiveAt(name, effectiveAt)` — secrets |
| `fastedge::kv` | `KvStore.open(name)` — key-value store |

Plus standard Web APIs: `fetch`, `Request`, `Response`, `Headers`, `URL`, `crypto`, streams, timers, `TextEncoder`/`TextDecoder`.

## See Also

- [GitHub Repository](https://github.com/G-Core/FastEdge-sdk-js)
- [npm Package](https://www.npmjs.com/package/@gcoredev/fastedge-sdk-js)
- [FastEdge Platform](https://gcore.com/fastedge)
- [Deployment Guide](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)
