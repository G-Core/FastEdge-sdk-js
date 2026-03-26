# FastEdge JS SDK Documentation

The FastEdge JS SDK (`@gcoredev/fastedge-sdk-js`) is the JavaScript/TypeScript development toolkit for building serverless edge applications on Gcore's FastEdge platform. It compiles your code into WebAssembly components that run across global edge data centers.

## Package

| Field       | Value                       |
| ----------- | --------------------------- |
| **npm**     | `@gcoredev/fastedge-sdk-js` |
| **Version** | `2.1.0`                     |
| **Node**    | `>=22`                      |
| **License** | `Apache-2.0`                |

## CLI Tools

| Tool                | Command                                    | Purpose                         |
| ------------------- | ------------------------------------------ | ------------------------------- |
| **fastedge-build**  | `npx fastedge-build <input> <output>`      | Compile JS/TS to WebAssembly    |
| **fastedge-init**   | `npx fastedge-init`                        | Interactive project scaffolding |
| **fastedge-assets** | `npx fastedge-assets <input> <output>`     | Generate static asset manifest  |

## Documentation

| Document                             | Description                                  |
| ------------------------------------ | -------------------------------------------- |
| [Quickstart](quickstart.md)          | Installation and first build                 |
| [fastedge-build CLI](BUILD_CLI.md)   | Compile JavaScript to WebAssembly            |
| [fastedge-init CLI](INIT_CLI.md)     | Scaffold a new FastEdge project              |
| [fastedge-assets CLI](ASSETS_CLI.md) | Generate static asset manifests              |
| [Static Sites](STATIC_SITES.md)      | Serve static websites from WASM              |
| [SDK Runtime API](SDK_API.md)        | Environment, KV Store, Secrets, and Web APIs |

## Application Model

FastEdge apps use the Service Worker API pattern. The `addEventListener('fetch', ...)` call must be at the top level. The callback must synchronously call `event.respondWith()` with a handler that returns a `Response` (or `Promise<Response>`).

```js
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function handler(event) {
  const request = event.request;
  return new Response(`Hello from the edge! You requested: ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(handler(event));
});
```

## Build Types

| Type       | Description                         | CLI                                                 |
| ---------- | ----------------------------------- | --------------------------------------------------- |
| **HTTP**   | Standard request handler            | `fastedge-build src/index.js output.wasm`           |
| **Static** | Serve static files embedded in WASM | `fastedge-build --config .fastedge/build-config.js` |

## Runtime APIs

Runtime APIs are available via `fastedge::` module specifiers inside your application code. These imports are resolved at compile time by the SDK.

### FastEdge APIs

| Import              | Export                 | Signature                                            |
| ------------------- | ---------------------- | ---------------------------------------------------- |
| `fastedge::env`     | `getEnv`               | `(name: string): string`                             |
| `fastedge::secret`  | `getSecret`            | `(name: string): string`                             |
| `fastedge::secret`  | `getSecretEffectiveAt` | `(name: string, effectiveAt: number): string`        |
| `fastedge::kv`      | `KvStore.open`         | `(name: string): KvStoreInstance`                    |

### KvStoreInstance Methods

| Method          | Signature                                                               | Description                                           |
| --------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `get`           | `(key: string): ArrayBuffer \| null`                                    | Retrieve a value by key                               |
| `scan`          | `(pattern: string): Array<string>`                                      | Retrieve keys matching a prefix pattern (e.g. `foo*`) |
| `zrangeByScore` | `(key: string, min: number, max: number): Array<[ArrayBuffer, number]>` | Retrieve sorted set entries by score range            |
| `zscan`         | `(key: string, pattern: string): Array<[ArrayBuffer, number]>`          | Retrieve sorted set entries matching a prefix pattern |
| `bfExists`      | `(key: string, value: string): boolean`                                 | Check if a value exists in a Bloom Filter             |

### Web APIs

Standard Web APIs available globally:

- `fetch`, `Request`, `Response`, `Headers`
- `URL`, `URLSearchParams`
- `ReadableStream`, `WritableStream`, `TransformStream`
- `TextEncoder`, `TextDecoder`
- `crypto` (SubtleCrypto)
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`

## See Also

- [GitHub Repository](https://github.com/G-Core/FastEdge-sdk-js)
- [npm Package](https://www.npmjs.com/package/@gcoredev/fastedge-sdk-js)
- [FastEdge Platform](https://gcore.com/fastedge)
- [Deployment Guide](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)
