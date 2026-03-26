# SDK API Reference

Runtime APIs available to FastEdge applications compiled to WebAssembly.

## FastEdge APIs

### Environment Variables

**Module:** `fastedge::env`

```typescript
import { getEnv } from "fastedge::env";
```

| Function       | Signature                  | Returns  |
| -------------- | -------------------------- | -------- |
| `getEnv(name)` | `(name: string) => string \| null` | `string \| null` |

Retrieves the value of a named environment variable, or `null` if not set. Environment variables are set on the application and injected at request time.

**Note:** Environment variables can only be read during request processing, not during build-time initialization.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { getEnv } from "fastedge::env";

async function app(event) {
  const hostname = getEnv("HOSTNAME");
  const traceId  = getEnv("TRACE_ID");

  return new Response(`hostname=${hostname} trace=${traceId}`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### Secrets

**Module:** `fastedge::secret`

```typescript
import { getSecret, getSecretEffectiveAt } from "fastedge::secret";
```

| Function                           | Signature                                       | Returns  |
| ---------------------------------- | ----------------------------------------------- | -------- |
| `getSecret(name)`                  | `(name: string) => string \| null`                      | `string \| null` |
| `getSecretEffectiveAt(name, slot)` | `(name: string, effectiveAt: number) => string \| null` | `string \| null` |

**Note:** Secrets can only be read during request processing, not during build-time initialization.

#### `getSecret`

Retrieves the current value of a named secret variable.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { getSecret } from "fastedge::secret";

async function app(event) {
  const token = getSecret("API_TOKEN");

  return new Response("ok", {
    status: 200,
    headers: { "X-Auth": token },
  });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

#### `getSecretEffectiveAt`

Retrieves the value of a named secret from a specific slot. The `effectiveAt` parameter is a slot index; when secret rotation is based on time, this is a Unix timestamp. The slot returned is the most recent slot where `slot <= effectiveAt`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { getSecretEffectiveAt } from "fastedge::secret";

async function app(event) {
  // Retrieve the secret valid at a specific Unix timestamp
  const token = getSecretEffectiveAt("API_TOKEN", 1745698356);

  return new Response("ok", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### KV Store

**Module:** `fastedge::kv`

```typescript
import { KvStore } from "fastedge::kv";
```

The `KvStore` class provides access to key-value stores attached to the application. Open a store by name using the static `open` method, then use the returned instance to query data.

#### `KvStore.open`

```typescript
static open(name: string): KvStoreInstance
```

Opens a named KV store and returns an instance. The `name` must match a store configured on the application. Throws if the store cannot be opened.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  try {
    const kv  = KvStore.open("my-store");
    const buf = kv.get("config");

    if (buf === null) {
      return new Response("not found", { status: 404 });
    }

    const text = new TextDecoder().decode(buf);
    return new Response(text, { status: 200 });
  } catch (err) {
    return new Response("store error", { status: 500 });
  }
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

#### KvStoreInstance methods

| Method                         | Signature                                                                 | Returns                       |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------- |
| `get(key)`                     | `(key: string) => ArrayBuffer \| null`                                    | `ArrayBuffer \| null`         |
| `scan(pattern)`                | `(pattern: string) => Array<string>`                                      | `Array<string>`               |
| `zrangeByScore(key, min, max)` | `(key: string, min: number, max: number) => Array<[ArrayBuffer, number]>` | `Array<[ArrayBuffer, number]>` |
| `zscan(key, pattern)`          | `(key: string, pattern: string) => Array<[ArrayBuffer, number]>`          | `Array<[ArrayBuffer, number]>` |
| `bfExists(key, value)`         | `(key: string, value: string) => boolean`                                 | `boolean`                     |

##### `get`

Retrieves the value for a key. Returns `null` if the key does not exist. The returned `ArrayBuffer` can be decoded with `TextDecoder` for string values.

```javascript
const buf = kv.get("my-key");
if (buf !== null) {
  const text = new TextDecoder().decode(buf);
}
```

##### `scan`

Returns all keys matching a prefix pattern. The pattern must include a wildcard character (e.g., `"prefix*"`). Returns an empty array if no keys match.

```javascript
const keys = kv.scan("user:*");
// keys: Array<string> — e.g. ["user:1", "user:2"]
```

##### `zrangeByScore`

Returns all entries from a sorted set (ZSet) whose scores fall within `[min, max]`. Each entry is a `[value, score]` tuple where `value` is an `ArrayBuffer`. Returns an empty array if no entries fall in range.

```javascript
const entries = kv.zrangeByScore("leaderboard", 100, 500);
for (const [buf, score] of entries) {
  const name = new TextDecoder().decode(buf);
  console.log(name, score);
}
```

##### `zscan`

Returns all entries from a sorted set whose values match a prefix pattern. The pattern must include a wildcard (e.g., `"foo*"`). Each entry is a `[value, score]` tuple where `value` is an `ArrayBuffer`. Returns an empty array if no entries match.

```javascript
const entries = kv.zscan("leaderboard", "user:*");
for (const [buf, score] of entries) {
  const name = new TextDecoder().decode(buf);
  console.log(name, score);
}
```

##### `bfExists`

Checks whether a value is present in a Bloom Filter stored under the given key. Returns `true` if the value likely exists, `false` if it definitely does not.

```javascript
const seen = kv.bfExists("visited-ips", event.client.address);
```

---

## Fetch Event

Every FastEdge application handles incoming requests by registering a listener for the `"fetch"` event.

```typescript
addEventListener("fetch", (event: FetchEvent) => void);
```

### FetchEvent

| Property / Method | Type                                                    | Description                                                     |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `request`         | `Request`                                               | The incoming HTTP request from the client.                      |
| `client`          | `ClientInfo`                                            | Information about the downstream client.                        |
| `respondWith`     | `(response: Response \| PromiseLike<Response>) => void` | Sends a response back to the client.                            |
| `waitUntil`       | `(promise: Promise<any>) => void`                       | Extends the service lifetime until the promise settles.         |

`respondWith` must be called synchronously within the event listener, but may be passed a `Promise<Response>`. The service is kept alive until the response is fully sent. Use `waitUntil` to perform work (e.g., logging, telemetry) after the response has been sent.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const { request, client } = event;

  event.waitUntil(
    logRequest(request.url, client.address)
  );

  return new Response("hello", { status: 200 });
}

async function logRequest(url, ip) {
  await fetch("https://logging.example.com/log", {
    method: "POST",
    body: JSON.stringify({ url, ip }),
    headers: { "content-type": "application/json" },
  });
}
```

### ClientInfo

Information about the downstream client that made the request, available as `event.client`.

| Property               | Type          | Description                                          |
| ---------------------- | ------------- | ---------------------------------------------------- |
| `address`              | `string`      | IPv4 or IPv6 address of the downstream client.       |
| `tlsJA3MD5`            | `string`      | JA3 MD5 fingerprint of the TLS client hello.         |
| `tlsCipherOpensslName` | `string`      | OpenSSL name of the negotiated TLS cipher.           |
| `tlsProtocol`          | `string`      | Negotiated TLS protocol version string.              |
| `tlsClientCertificate` | `ArrayBuffer` | Raw bytes of the client TLS certificate, if present. |
| `tlsClientHello`       | `ArrayBuffer` | Raw bytes of the TLS client hello message.           |

---

## Web APIs

The following standard Web APIs are available in the FastEdge runtime.

### Fetch API

#### `fetch`

```typescript
fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
```

Makes an outbound HTTP request. Follows the [WHATWG Fetch specification](https://fetch.spec.whatwg.org/).

```javascript
const response = await fetch("https://api.example.com/data", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});
const data = await response.json();
```

#### `Request`

```typescript
new Request(input: RequestInfo | URL, init?: RequestInit): Request
```

| `RequestInit` field    | Type               | Description                                                        |
| ---------------------- | ------------------ | ------------------------------------------------------------------ |
| `method`               | `string`           | HTTP method. Defaults to `"GET"`.                                  |
| `headers`              | `HeadersInit`      | Request headers.                                                   |
| `body`                 | `BodyInit \| null` | Request body.                                                      |
| `manualFramingHeaders` | `boolean`          | When `true`, disables automatic framing header management.         |

| `Request` property / method       | Type                                  | Description                                       |
| --------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `method`                          | `string`                              | HTTP method.                                      |
| `url`                             | `string`                              | Request URL as a string.                          |
| `headers`                         | `Headers`                             | Request headers (read-only on incoming requests). |
| `body`                            | `ReadableStream<Uint8Array> \| null`  | Request body stream.                              |
| `bodyUsed`                        | `boolean`                             | Whether the body has already been consumed.       |
| `clone()`                         | `() => Request`                       | Creates a copy of the request.                    |
| `text()`                          | `() => Promise<string>`               | Reads body as a string.                           |
| `json()`                          | `() => Promise<any>`                  | Reads body and parses as JSON.                    |
| `arrayBuffer()`                   | `() => Promise<ArrayBuffer>`          | Reads body as an `ArrayBuffer`.                   |
| `setCacheKey(key)`                | `(key: string) => void`               | Sets a custom cache key for the request.          |
| `setManualFramingHeaders(manual)` | `(manual: boolean) => void`           | Toggles manual framing header control.            |

**Note:** The `headers` property on an incoming `request` object (from `event.request`) is immutable — calls to `append`, `set`, or `delete` will throw. Clone the request or construct a new `Headers` object to modify headers.

#### `Response`

```typescript
new Response(body?: BodyInit | null, init?: ResponseInit): Response
Response.redirect(url: string | URL, status?: number): Response
Response.json(data: any, init?: ResponseInit): Response
```

| `ResponseInit` field   | Type          | Description                                                |
| ---------------------- | ------------- | ---------------------------------------------------------- |
| `status`               | `number`      | HTTP status code. Defaults to `200`.                       |
| `statusText`           | `string`      | HTTP status text.                                          |
| `headers`              | `HeadersInit` | Response headers.                                          |
| `manualFramingHeaders` | `boolean`     | When `true`, disables automatic framing header management. |

| `Response` property / method      | Type                                 | Description                                         |
| --------------------------------- | ------------------------------------ | --------------------------------------------------- |
| `status`                          | `number`                             | HTTP status code.                                   |
| `statusText`                      | `string`                             | HTTP status text.                                   |
| `ok`                              | `boolean`                            | `true` if status is in the range 200–299.           |
| `url`                             | `string`                             | URL of the response.                                |
| `headers`                         | `Headers`                            | Response headers.                                   |
| `body`                            | `ReadableStream<Uint8Array> \| null` | Response body stream.                               |
| `bodyUsed`                        | `boolean`                            | Whether the body has already been consumed.         |
| `text()`                          | `() => Promise<string>`              | Reads body as a string.                             |
| `json()`                          | `() => Promise<any>`                 | Reads body and parses as JSON.                      |
| `arrayBuffer()`                   | `() => Promise<ArrayBuffer>`         | Reads body as an `ArrayBuffer`.                     |
| `setManualFramingHeaders(manual)` | `(manual: boolean) => void`          | Toggles manual framing header control.              |

#### `Headers`

```typescript
new Headers(init?: HeadersInit): Headers
```

`HeadersInit` accepts a `Headers` instance, a `string[][]` array of `[name, value]` pairs, or a `Record<string, string>` object.

| Method                | Signature                                                                   |
| --------------------- | --------------------------------------------------------------------------- |
| `get(name)`           | `(name: string) => string \| null`                                          |
| `has(name)`           | `(name: string) => boolean`                                                 |
| `set(name, value)`    | `(name: string, value: string) => void`                                     |
| `append(name, value)` | `(name: string, value: string) => void`                                     |
| `delete(name)`        | `(name: string) => void`                                                    |
| `forEach(callback)`   | `(callback: (value: string, key: string, parent: Headers) => void) => void` |
| `entries()`           | `() => IterableIterator<[string, string]>`                                  |
| `keys()`              | `() => IterableIterator<string>`                                             |
| `values()`            | `() => IterableIterator<string>`                                             |

**Immutability note:** The `headers` object on an incoming `event.request` is read-only. Attempting to mutate it will throw a `TypeError`. To add or change headers, construct a new `Headers` object:

```javascript
const newHeaders = new Headers(event.request.headers);
newHeaders.set("x-custom", "value");

const proxied = new Request(event.request.url, {
  method: event.request.method,
  headers: newHeaders,
  body: event.request.body,
});
```

---

### URL API

#### `URL`

```typescript
new URL(url: string, base?: string | URL): URL
```

Parses and manipulates URLs per the [WHATWG URL specification](https://url.spec.whatwg.org/).

| Property       | Type              | Mutable |
| -------------- | ----------------- | ------- |
| `href`         | `string`          | yes     |
| `origin`       | `string`          | no      |
| `protocol`     | `string`          | yes     |
| `username`     | `string`          | yes     |
| `password`     | `string`          | yes     |
| `host`         | `string`          | yes     |
| `hostname`     | `string`          | yes     |
| `port`         | `string`          | yes     |
| `pathname`     | `string`          | yes     |
| `search`       | `string`          | yes     |
| `searchParams` | `URLSearchParams` | no      |
| `hash`         | `string`          | yes     |

```javascript
const url = new URL(event.request.url);
const id  = url.searchParams.get("id");
```

#### `URLSearchParams`

```typescript
new URLSearchParams(
  init?: string | ReadonlyArray<readonly [string, string]> | Iterable<readonly [string, string]> | Record<string, string>
): URLSearchParams
```

| Method                | Signature                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `get(name)`           | `(name: string) => string \| null`                                                          |
| `getAll(name)`        | `(name: string) => string[]`                                                                |
| `has(name)`           | `(name: string) => boolean`                                                                 |
| `set(name, value)`    | `(name: string, value: string) => void`                                                     |
| `append(name, value)` | `(name: string, value: string) => void`                                                     |
| `delete(name)`        | `(name: string) => void`                                                                    |
| `sort()`              | `() => void`                                                                                |
| `entries()`           | `() => IterableIterator<[string, string]>`                                                  |
| `keys()`              | `() => IterableIterator<string>`                                                            |
| `values()`            | `() => IterableIterator<string>`                                                            |
| `forEach(callback)`   | `(callback: (value: string, name: string, searchParams: URLSearchParams) => void) => void` |

---

### Streams API

The WHATWG Streams API is available for constructing and transforming streaming bodies.

#### `ReadableStream`

```typescript
new ReadableStream<R>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>
```

| `UnderlyingSource` field | Type                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| `start`                  | `(controller: ReadableStreamDefaultController<R>) => any`                       |
| `pull`                   | `(controller: ReadableStreamDefaultController<R>) => void \| PromiseLike<void>` |
| `cancel`                 | `(reason?: any) => void \| PromiseLike<void>`                                   |
| `type`                   | `"bytes" \| undefined`                                                          |
| `autoAllocateChunkSize`  | `number`                                                                        |

| `ReadableStream` method            | Signature                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `getReader()`                      | `() => ReadableStreamDefaultReader<R>`                                                      |
| `pipeTo(dest, options?)`           | `(dest: WritableStream<R>, options?: StreamPipeOptions) => Promise<void>`                   |
| `pipeThrough(transform, options?)` | `(transform: ReadableWritablePair<T, R>, options?: StreamPipeOptions) => ReadableStream<T>` |
| `tee()`                            | `() => [ReadableStream<R>, ReadableStream<R>]`                                              |
| `cancel(reason?)`                  | `(reason?: any) => Promise<void>`                                                           |

```javascript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("hello "));
    controller.enqueue(new TextEncoder().encode("world"));
    controller.close();
  },
});

return new Response(stream, { status: 200 });
```

#### `WritableStream`

```typescript
new WritableStream<W>(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>): WritableStream<W>
```

| `WritableStream` method | Signature                              |
| ----------------------- | -------------------------------------- |
| `getWriter()`           | `() => WritableStreamDefaultWriter<W>` |
| `abort(reason?)`        | `(reason?: any) => Promise<void>`      |

#### `TransformStream`

```typescript
new TransformStream<I, O>(
  transformer?: Transformer<I, O>,
  writableStrategy?: QueuingStrategy<I>,
  readableStrategy?: QueuingStrategy<O>,
): TransformStream<I, O>
```

| Property   | Type                | Description                         |
| ---------- | ------------------- | ----------------------------------- |
| `readable` | `ReadableStream<O>` | The readable side of the transform. |
| `writable` | `WritableStream<I>` | The writable side of the transform. |

---

### Encoding API

#### `TextEncoder` / `TextDecoder`

Standard `TextEncoder` and `TextDecoder` are available as globals for converting between strings and `Uint8Array`.

```javascript
const encoded = new TextEncoder().encode("hello");    // Uint8Array
const decoded = new TextDecoder().decode(encoded);    // "hello"
```

#### Base64

```typescript
atob(data: string): string
btoa(data: string): string
```

| Function | Description                                       |
| -------- | ------------------------------------------------- |
| `btoa`   | Encodes a binary string to a Base64 ASCII string. |
| `atob`   | Decodes a Base64 ASCII string to a binary string. |

```javascript
const encoded = btoa("hello world");    // "aGVsbG8gd29ybGQ="
const decoded = atob(encoded);          // "hello world"
```

---

### Crypto API

#### `crypto`

The global `crypto` object provides access to cryptographic operations.

```typescript
crypto.getRandomValues<T extends ArrayBufferView | null>(array: T): T
crypto.randomUUID(): string
crypto.subtle: SubtleCrypto
```

#### `SubtleCrypto`

Available as `crypto.subtle`. Supported operations:

| Method      | Signature                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `digest`    | `(algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>`                                          |
| `importKey` | See overloads below                                                                                                      |
| `sign`      | `(algorithm: AlgorithmIdentifier, key: CryptoKey, data: BufferSource) => Promise<ArrayBuffer>`                          |
| `verify`    | `(algorithm: AlgorithmIdentifier, key: CryptoKey, signature: BufferSource, data: BufferSource) => Promise<boolean>`     |

`importKey` overloads:

```typescript
// JWK format
subtle.importKey(
  format: 'jwk',
  keyData: JsonWebKey,
  algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams,
  extractable: boolean,
  keyUsages: ReadonlyArray<KeyUsage>,
): Promise<CryptoKey>

// Raw / other formats
subtle.importKey(
  format: Exclude<KeyFormat, 'jwk'>,
  keyData: BufferSource,
  algorithm: AlgorithmIdentifier | RsaHashedImportParams | HmacImportParams,
  extractable: boolean,
  keyUsages: KeyUsage[],
): Promise<CryptoKey>
```

Supported `KeyFormat` values: `"jwk"`, `"raw"`.

```javascript
// Compute SHA-256 digest
const data    = new TextEncoder().encode("hello world");
const hashBuf = await crypto.subtle.digest("SHA-256", data);
const hashHex = Array.from(new Uint8Array(hashBuf))
  .map(b => b.toString(16).padStart(2, "0"))
  .join("");
```

---

### Timers

```typescript
setTimeout(callback: (...args: TArgs) => void, delay?: number, ...args: TArgs): number
clearTimeout(timeoutID?: number): void

setInterval(callback: (...args: TArgs) => void, delay?: number, ...args: TArgs): number
clearInterval(intervalID?: number): void
```

| Function        | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `setTimeout`    | Calls `callback` once after `delay` milliseconds. Returns a timer ID.       |
| `clearTimeout`  | Cancels a timer created by `setTimeout`.                                    |
| `setInterval`   | Calls `callback` repeatedly every `delay` milliseconds. Returns a timer ID. |
| `clearInterval` | Cancels a repeating timer created by `setInterval`.                         |

---

### Console

The global `console` object writes to stdout. Unlike browser or Node.js implementations, this version does not perform string substitution in format strings — all arguments are stringified and concatenated.

| Method               | Description                              |
| -------------------- | ---------------------------------------- |
| `console.log`        | General output.                          |
| `console.info`       | Informational output.                    |
| `console.warn`       | Warning output.                          |
| `console.error`      | Error output.                            |
| `console.debug`      | Debug output.                            |
| `console.assert`     | Logs if condition is falsy.              |
| `console.trace`      | Outputs a stack trace.                   |
| `console.time`       | Starts a named timer.                    |
| `console.timeEnd`    | Stops a named timer and logs elapsed ms. |
| `console.timeLog`    | Logs current elapsed time for a timer.   |
| `console.count`      | Logs call count for a label.             |
| `console.countReset` | Resets call count for a label.           |
| `console.group`      | Starts an indented group.                |
| `console.groupEnd`   | Ends an indented group.                  |
| `console.dir`        | Logs object representation.              |
| `console.table`      | Logs tabular data.                       |

---

### Performance API

```typescript
performance.now(): DOMHighResTimeStamp   // number (milliseconds)
performance.timeOrigin: DOMHighResTimeStamp
```

`performance.now()` returns a high-resolution timestamp in milliseconds relative to `performance.timeOrigin`.

```javascript
const start   = performance.now();
// ... work ...
const elapsed = performance.now() - start;
console.log(`elapsed: ${elapsed}ms`);
```

---

### Additional Globals

| Global                          | Type / Signature                                            | Description                                       |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `self`                          | `typeof globalThis`                                         | Reference to the global object.                   |
| `location`                      | `WorkerLocation`                                            | URL of the current worker script.                 |
| `queueMicrotask(callback)`      | `(callback: () => void) => void`                            | Queues a microtask.                               |
| `structuredClone(value, opts?)` | `(value: any, options?: StructuredSerializeOptions) => any` | Deep-clones a value. Transferable: `ArrayBuffer`. |

---

## See Also

- [quickstart.md](quickstart.md) — Getting started with your first FastEdge application
- [BUILD_CLI.md](BUILD_CLI.md) — `fastedge-build` CLI reference
- [INIT_CLI.md](INIT_CLI.md) — `fastedge-init` CLI reference
- [STATIC_SITES.md](STATIC_SITES.md) — Serving static assets from WASM
- [ASSETS_CLI.md](ASSETS_CLI.md) — `fastedge-assets` CLI reference
