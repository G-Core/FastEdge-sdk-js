# FastEdge JS SDK Documentation

The FastEdge JS SDK (`@gcoredev/fastedge-sdk-js`) is the JavaScript/TypeScript development toolkit for building serverless edge applications on Gcore's FastEdge platform. It compiles your code into WebAssembly components that run across global edge data centers.

## Package

| Field       | Value                       |
| ----------- | --------------------------- |
| **npm**     | `@gcoredev/fastedge-sdk-js` |
| **Version** | `2.2.2`                     |
| **Node**    | `>=22`                      |
| **License** | `Apache-2.0`                |

## CLI Tools

| Tool                | Command                                | Purpose                         |
| ------------------- | -------------------------------------- | ------------------------------- |
| **fastedge-build**  | `npx fastedge-build <input> <output>`  | Compile JS/TS to WebAssembly    |
| **fastedge-init**   | `npx fastedge-init`                    | Interactive project scaffolding |
| **fastedge-assets** | `npx fastedge-assets <input> <output>` | Generate static asset manifest  |

## Documentation

| Document                             | Description                                         |
| ------------------------------------ | --------------------------------------------------- |
| [Quickstart](quickstart.md)          | Installation and first build                        |
| [fastedge-build CLI](BUILD_CLI.md)   | Compile JavaScript to WebAssembly                   |
| [fastedge-init CLI](INIT_CLI.md)     | Scaffold a new FastEdge project                     |
| [fastedge-assets CLI](ASSETS_CLI.md) | Generate static asset manifests                     |
| [Static Sites](STATIC_SITES.md)      | Serve static websites from WASM                     |
| [SDK Runtime API](SDK_API.md)        | Environment, KV Store, Cache, Secrets, and Web APIs |

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

| Type       | Description                         | CLI                                                   |
| ---------- | ----------------------------------- | ----------------------------------------------------- |
| **HTTP**   | Standard request handler            | `fastedge-build src/index.js output.wasm`             |
| **Static** | Serve static files embedded in WASM | `fastedge-build --config .fastedge/build-config.js`   |

## Runtime APIs

Runtime APIs are available via `fastedge::` module specifiers inside your application code. These imports are resolved at compile time by the SDK.

### FastEdge APIs

| Import             | Export                 | Signature                                             |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| `fastedge::env`    | `getEnv`               | `(name: string): string \| null`                      |
| `fastedge::secret` | `getSecret`            | `(name: string): string \| null`                      |
| `fastedge::secret` | `getSecretEffectiveAt` | `(name: string, effectiveAt: number): string \| null` |
| `fastedge::kv`     | `KvStore.open`         | `(name: string): KvStoreInstance`                     |
| `fastedge::cache`  | `Cache`                | static class — see Cache Methods                      |
| `fastedge::fs`     | `readFileSync`         | `(path: string): Uint8Array` — build-time only        |

### KvStoreInstance Methods

| Method                 | Signature                                                                          | Description                                            |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `get`                  | `(key: string): ArrayBuffer \| null`                                               | Retrieve a value by key                                |
| `getEntry`             | `(key: string): Promise<KvStoreEntry \| null>`                                     | Retrieve a value as a `KvStoreEntry`                   |
| `scan`                 | `(pattern: string): Array<string>`                                                 | Retrieve keys matching a prefix pattern (e.g. `foo*`) |
| `zrangeByScore`        | `(key: string, min: number, max: number): Array<[ArrayBuffer, number]>`            | Retrieve sorted set entries by score range             |
| `zrangeByScoreEntries` | `(key: string, min: number, max: number): Promise<Array<[KvStoreEntry, number]>>` | `zrangeByScore` returning `KvStoreEntry` wrappers      |
| `zscan`                | `(key: string, pattern: string): Array<[ArrayBuffer, number]>`                     | Retrieve sorted set entries matching a prefix pattern  |
| `zscanEntries`         | `(key: string, pattern: string): Promise<Array<[KvStoreEntry, number]>>`           | `zscan` returning `KvStoreEntry` wrappers              |
| `bfExists`             | `(key: string, value: string): boolean`                                            | Check if a value exists in a Bloom Filter              |

### KvStoreEntry Methods

The `getEntry`, `zrangeByScoreEntries`, and `zscanEntries` methods return `KvStoreEntry` objects with the following accessors. The bytes are already in memory when the entry is returned; the `Promise`-returning methods resolve immediately.

| Method        | Signature                  | Description                              |
| ------------- | -------------------------- | ---------------------------------------- |
| `arrayBuffer` | `(): Promise<ArrayBuffer>` | Read the entry as an `ArrayBuffer`       |
| `text`        | `(): Promise<string>`      | Read the entry as a UTF-8 decoded string |
| `json`        | `(): Promise<unknown>`     | Read the entry as parsed JSON            |

### Cache Methods

Import the `Cache` class from `fastedge::cache`. All methods are static; `Cache` is never instantiated. The cache is POP-local: values written in one data center are not visible to another. Use `fastedge::kv` for globally-replicated storage.

```js
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const ip = event.request.headers.get("x-forwarded-for") ?? "unknown";
  const count = await Cache.incr(`rl:${ip}`);
  if (count === 1) await Cache.expire(`rl:${ip}`, { ttl: 60 });
  if (count > 100) return new Response("Too Many Requests", { status: 429 });

  const entry = await Cache.getOrSet(
    "result",
    async () => JSON.stringify(await compute()),
    { ttl: 300 },
  );
  return new Response(await entry.text(), {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", (event) => event.respondWith(app(event)));
```

| Method      | Signature                                                                                                          | Description                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `get`       | `(key: string): Promise<CacheEntry \| null>`                                                                       | Get entry or `null` if absent or expired             |
| `exists`    | `(key: string): Promise<boolean>`                                                                                  | Check key presence without transferring value        |
| `set`       | `(key: string, value: CacheValue, options?: WriteOptions): Promise<void>`                                          | Store a value, optionally with expiry                |
| `delete`    | `(key: string): Promise<void>`                                                                                     | Remove a key; no-op if absent                        |
| `expire`    | `(key: string, options: WriteOptions): Promise<boolean>`                                                           | Update expiry; `true` if key exists, `false` if not  |
| `incr`      | `(key: string, delta?: number): Promise<number>`                                                                   | Atomically increment an integer; returns new value   |
| `decr`      | `(key: string, delta?: number): Promise<number>`                                                                   | Atomically decrement an integer; returns new value   |
| `getOrSet`  | `(key: string, populate: () => CacheValue \| Promise<CacheValue>, options?: WriteOptions): Promise<CacheEntry>`   | Get entry or populate, cache, and return the result  |

### CacheValue

`CacheValue` is the union of types accepted by `Cache.set`, `Cache.getOrSet`, and the `populate` callback. All forms are coerced to raw bytes before storage.

```ts
type CacheValue = string | ArrayBuffer | ArrayBufferView | ReadableStream | Response;
```

### WriteOptions

Controls how long a cache entry lives. Pass exactly one field. Omit the options bag entirely to store with no expiry.

| Field       | Type     | Description                                                                          |
| ----------- | -------- | ------------------------------------------------------------------------------------ |
| `ttl`       | `number` | Relative TTL in seconds from now. Mutually exclusive with `ttlMs` and `expiresAt`.   |
| `ttlMs`     | `number` | Relative TTL in milliseconds from now. Mutually exclusive with `ttl` and `expiresAt`. |
| `expiresAt` | `number` | Absolute expiry, Unix epoch seconds. Mutually exclusive with `ttl` and `ttlMs`.      |

### CacheEntry Methods

`Cache.get` and `Cache.getOrSet` return `CacheEntry` objects. The bytes are already in memory; the `Promise`-returning methods resolve immediately.

| Method        | Signature                  | Description                              |
| ------------- | -------------------------- | ---------------------------------------- |
| `arrayBuffer` | `(): Promise<ArrayBuffer>` | Read the entry as an `ArrayBuffer`       |
| `text`        | `(): Promise<string>`      | Read the entry as a UTF-8 decoded string |
| `json`        | `(): Promise<unknown>`     | Read the entry as parsed JSON            |

### Web APIs

Standard Web APIs available globally:

- `fetch`, `Request`, `Response`, `Headers`
- `URL`, `URLSearchParams`
- `ReadableStream`, `WritableStream`, `TransformStream`
- `CompressionStream`, `DecompressionStream`
- `TextEncoder`, `TextDecoder`
- `Blob`, `File`, `FormData`
- `crypto` (SubtleCrypto: `digest`, `importKey`, `sign`, `verify`)
- `AbortController`, `AbortSignal`
- `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`
- `queueMicrotask`, `structuredClone`
- `performance`, `location`, `console`
- `atob`, `btoa`

## See Also

- [GitHub Repository](https://github.com/G-Core/FastEdge-sdk-js)
- [npm Package](https://www.npmjs.com/package/@gcoredev/fastedge-sdk-js)
- [FastEdge Platform](https://gcore.com/fastedge)
- [Deployment Guide](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)
