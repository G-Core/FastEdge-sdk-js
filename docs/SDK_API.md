# SDK API Reference

Runtime APIs available to FastEdge applications compiled to WebAssembly.

## FastEdge APIs

### Environment Variables

**Module:** `fastedge::env`

```typescript
import { getEnv } from "fastedge::env";
```

| Function       | Signature                          | Returns          |
| -------------- | ---------------------------------- | ---------------- |
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

| Function                                  | Signature                                               | Returns          |
| ----------------------------------------- | ------------------------------------------------------- | ---------------- |
| `getSecret(name)`                         | `(name: string) => string \| null`                      | `string \| null` |
| `getSecretEffectiveAt(name, effectiveAt)` | `(name: string, effectiveAt: number) => string \| null` | `string \| null` |

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

`KvStore` is globally replicated with eventual consistency. Values written in one data center eventually become visible in others. It is suited to globally-shared configuration, lookup tables, and sorted sets. For strongly-consistent, POP-local storage with atomic counter primitives, see [Cache](#cache) below.

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

#### KvStoreEntry

A handle to a value retrieved from the KV store. The bytes are already in memory when you receive a `KvStoreEntry`; the accessor methods return `Promise` to align with the standard Web `Body` interface, but they resolve immediately.

| Method          | Signature                    | Returns                |
| --------------- | ---------------------------- | ---------------------- |
| `arrayBuffer()` | `() => Promise<ArrayBuffer>` | `Promise<ArrayBuffer>` |
| `text()`        | `() => Promise<string>`      | `Promise<string>`      |
| `json()`        | `() => Promise<unknown>`     | `Promise<unknown>`     |

`json()` rejects with a `SyntaxError` if the bytes are not valid JSON.

#### KvStoreInstance methods

| Method                                | Signature                                                                           | Returns                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `get(key)`                            | `(key: string) => ArrayBuffer \| null`                                              | `ArrayBuffer \| null`                    |
| `getEntry(key)`                       | `(key: string) => Promise<KvStoreEntry \| null>`                                    | `Promise<KvStoreEntry \| null>`          |
| `scan(pattern)`                       | `(pattern: string) => Array<string>`                                                | `Array<string>`                          |
| `zrangeByScore(key, min, max)`        | `(key: string, min: number, max: number) => Array<[ArrayBuffer, number]>`           | `Array<[ArrayBuffer, number]>`           |
| `zrangeByScoreEntries(key, min, max)` | `(key: string, min: number, max: number) => Promise<Array<[KvStoreEntry, number]>>` | `Promise<Array<[KvStoreEntry, number]>>` |
| `zscan(key, pattern)`                 | `(key: string, pattern: string) => Array<[ArrayBuffer, number]>`                    | `Array<[ArrayBuffer, number]>`           |
| `zscanEntries(key, pattern)`          | `(key: string, pattern: string) => Promise<Array<[KvStoreEntry, number]>>`          | `Promise<Array<[KvStoreEntry, number]>>` |
| `bfExists(key, value)`                | `(key: string, value: string) => boolean`                                           | `boolean`                                |

##### `get`

Retrieves the value for a key. Returns `null` if the key does not exist. The returned `ArrayBuffer` can be decoded with `TextDecoder` for string values.

```javascript
const buf = kv.get("my-key");
if (buf !== null) {
  const text = new TextDecoder().decode(buf);
}
```

##### `getEntry`

Retrieves the value for a key as a `KvStoreEntry` with `text()`, `json()`, and `arrayBuffer()` accessors. Use this instead of `get` when you want to decode the value as a string or JSON without manual `TextDecoder` work.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv    = KvStore.open("my-store");
  const entry = await kv.getEntry("user:42");

  if (entry === null) {
    return new Response("not found", { status: 404 });
  }

  const user = await entry.json();
  return Response.json(user, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

##### `zrangeByScoreEntries`

Equivalent to `zrangeByScore` but each tuple's value is a `KvStoreEntry` instead of a raw `ArrayBuffer`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv      = KvStore.open("my-store");
  const entries = await kv.zrangeByScoreEntries("leaderboard", 100, 500);

  const rows = await Promise.all(
    entries.map(async ([entry, score]) => ({ name: await entry.text(), score }))
  );

  return Response.json(rows, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

##### `zscanEntries`

Equivalent to `zscan` but each tuple's value is a `KvStoreEntry` instead of a raw `ArrayBuffer`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv      = KvStore.open("my-store");
  const entries = await kv.zscanEntries("leaderboard", "user:*");

  const rows = await Promise.all(
    entries.map(async ([entry, score]) => ({ name: await entry.text(), score }))
  );

  return Response.json(rows, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `bfExists`

Checks whether a value is present in a Bloom Filter stored under the given key. Returns `true` if the value likely exists, `false` if it definitely does not.

```javascript
const seen = kv.bfExists("visited-ips", event.client.address);
```

---

### Cache

**Module:** `fastedge::cache`

```typescript
import { Cache } from "fastedge::cache";
```

`Cache` is a POP-local key/value store with TTL and atomic counter primitives. It is strongly consistent within a single point-of-presence and is designed for transient, request-time state: rate limiting, hit counters, response memoisation, and deduplicated origin fetches. A value written from one data center is not visible to another.

**`Cache` vs `KvStore` at a glance:**

| Concern           | `Cache`                                       | `KvStore`                                 |
| ----------------- | --------------------------------------------- | ----------------------------------------- |
| Consistency scope | Strong within a POP; independent across POPs  | Eventual; globally replicated             |
| Atomic operations | `incr`, `decr`, `getOrSet` coalescing         | Not available                             |
| Typical use cases | Rate limits, counters, request coalescing     | Configuration, lookup tables, sorted sets |
| Data persistence  | Evicted; no durability guarantee              | Durable; persists across deployments      |

Strong per-POP consistency makes `Cache.incr` / `Cache.decr` reliable for per-POP rate limits and `Cache.getOrSet` coalescing reliable for deduplicating concurrent origin fetches within a single POP. For globally-shared data that must be visible across all POPs, use `fastedge::kv`.

#### CacheValue

Values accepted by `Cache.set` and the `populate` callback of `Cache.getOrSet`:

```typescript
type CacheValue = string | ArrayBuffer | ArrayBufferView | ReadableStream | Response;
```

All forms are stored as raw bytes:

- `string` — encoded as UTF-8.
- `ArrayBuffer` / `ArrayBufferView` — used directly.
- `ReadableStream` — fully consumed before storage.
- `Response` — `response.arrayBuffer()` is consumed; status and headers are discarded. The cache stores bytes only. To round-trip status or headers, encode them into the value (e.g., as a JSON envelope).

#### WriteOptions

Controls how long a cache entry lives. Pass exactly one of `ttl`, `ttlMs`, or `expiresAt`. Passing more than one, or a zero or negative value, throws `TypeError`. Omitting `options` entirely stores the entry with no expiry (subject to host eviction policy).

| Field       | Type     | Description                                                                      |
| ----------- | -------- | -------------------------------------------------------------------------------- |
| `ttl`       | `number` | Relative TTL, seconds from now. Mutually exclusive with `ttlMs`, `expiresAt`.    |
| `ttlMs`     | `number` | Relative TTL, milliseconds from now. Mutually exclusive with `ttl`, `expiresAt`. |
| `expiresAt` | `number` | Absolute expiry, Unix epoch seconds. Mutually exclusive with `ttl`, `ttlMs`.     |

#### CacheEntry

A handle to a cached value. The bytes are already in memory when you receive a `CacheEntry`; the accessor methods return `Promise` to align with the standard Web `Body` interface, but they resolve immediately.

| Method          | Signature                    | Returns                |
| --------------- | ---------------------------- | ---------------------- |
| `arrayBuffer()` | `() => Promise<ArrayBuffer>` | `Promise<ArrayBuffer>` |
| `text()`        | `() => Promise<string>`      | `Promise<string>`      |
| `json()`        | `() => Promise<unknown>`     | `Promise<unknown>`     |

`json()` rejects with a `SyntaxError` if the bytes are not valid JSON.

#### Cache methods

All methods are static; `Cache` is never constructed. All methods return `Promise`. Operational errors surface as Promise rejections. Argument validation errors (wrong types, conflicting `WriteOptions` fields) throw synchronously; both are caught the same way by `try`/`catch` around an `await`.

| Method                              | Signature                                                                                                         | Returns                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `get(key)`                          | `(key: string) => Promise<CacheEntry \| null>`                                                                    | `Promise<CacheEntry \| null>` |
| `exists(key)`                       | `(key: string) => Promise<boolean>`                                                                               | `Promise<boolean>`            |
| `set(key, value, options?)`         | `(key: string, value: CacheValue, options?: WriteOptions) => Promise<void>`                                       | `Promise<void>`               |
| `delete(key)`                       | `(key: string) => Promise<void>`                                                                                  | `Promise<void>`               |
| `expire(key, options)`              | `(key: string, options: WriteOptions) => Promise<boolean>`                                                        | `Promise<boolean>`            |
| `incr(key, delta?)`                 | `(key: string, delta?: number) => Promise<number>`                                                                | `Promise<number>`             |
| `decr(key, delta?)`                 | `(key: string, delta?: number) => Promise<number>`                                                                | `Promise<number>`             |
| `getOrSet(key, populate, options?)` | `(key: string, populate: () => CacheValue \| Promise<CacheValue>, options?: WriteOptions) => Promise<CacheEntry>` | `Promise<CacheEntry>`         |

##### `get`

Returns the entry for `key`, or `null` if absent or expired.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const entry = await Cache.get("user:42");

  if (entry === null) {
    return new Response("not found", { status: 404 });
  }

  const user = await entry.json();
  return Response.json(user, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `exists`

Returns `true` if `key` is present in the cache. Cheaper than `get` when you only need presence, as no value bytes are transferred.

```javascript
const present = await Cache.exists("feature-flag:beta");
```

##### `set`

Stores `value` under `key`, optionally with an expiry. Overwrites any existing value at `key`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const session = { userId: 42, role: "admin" };

  // Store for 10 minutes
  await Cache.set("session:abc", JSON.stringify(session), { ttl: 600 });

  // Store with sub-second TTL
  await Cache.set("nonce:xyz", "used", { ttlMs: 500 });

  // Store until a fixed deadline
  await Cache.set("promo:summer", "active", { expiresAt: 1751328000 });

  return new Response("ok", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `delete`

Removes `key` from the cache. A no-op if the key does not exist.

```javascript
await Cache.delete("session:abc");
```

##### `expire`

Updates the expiry of an existing key without changing its value. Resolves to `true` if the expiry was set, `false` if the key does not exist.

```javascript
await Cache.expire("rl:1.2.3.4", { ttl: 60 });
```

##### `incr` and `decr`

Atomically increment or decrement an integer stored at `key`. If the key does not exist, it is initialised to `0` before the operation. Resolves to the new value after the operation. Rejects if the stored value is not an integer.

`delta` defaults to `1`. `Cache.decr` is sugar for `Cache.incr(key, -(delta ?? 1))`. `delta` may be any integer; prefer `decr` when subtracting for readability.

Strong per-POP consistency makes these operations reliable for per-POP rate limits and hit counters. Set the TTL on the first increment to establish the window:

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const ip    = event.client.address;
  const key   = `rl:${ip}`;
  const count = await Cache.incr(key);

  if (count === 1) {
    // First request in this window — set the 60-second expiry
    await Cache.expire(key, { ttl: 60 });
  }

  if (count > 100) {
    return new Response("Too Many Requests", { status: 429 });
  }

  return new Response("ok", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `getOrSet`

Returns the entry for `key`, or calls `populate` on a cache miss and stores the result. All concurrent callers for the same key within the same WASM instance share a single `populate` execution — the callback is not duplicated for joiners. Concurrent requests handled by other WASM instances race independently and may each call `populate`.

If `populate` throws or its Promise rejects, the rejection propagates to all current waiters. The next call after a failure retries `populate` (no negative caching).

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const url = new URL(event.request.url);

  // Coalesce concurrent origin fetches; cache result for 30 seconds
  const entry = await Cache.getOrSet(
    url.pathname,
    () => fetch(`https://origin.example.com${url.pathname}`),
    { ttl: 30 },
  );

  return new Response(await entry.arrayBuffer(), {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

## Fetch Event

Every FastEdge application handles incoming requests by registering a listener for the `"fetch"` event.

```typescript
addEventListener("fetch", (event: FetchEvent) => void);
```

### FetchEvent

| Property / Method | Type                                                    | Description                                             |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `request`         | `Request`                                               | The incoming HTTP request from the client.              |
| `client`          | `ClientInfo`                                            | Information about the downstream client.                |
| `respondWith`     | `(response: Response \| PromiseLike<Response>) => void` | Sends a response back to the client.                    |
| `waitUntil`       | `(promise: Promise<any>) => void`                       | Extends the service lifetime until the promise settles. |

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

| `RequestInit` field | Type                  | Description                       |
| ------------------- | --------------------- | --------------------------------- |
| `method`            | `string`              | HTTP method. Defaults to `"GET"`. |
| `headers`           | `HeadersInit`         | Request headers.                  |
| `body`              | `BodyInit \| null`    | Request body.                     |
| `signal`            | `AbortSignal \| null` | Abort signal for the request.     |

| `Request` property / method | Type                                 | Description                                       |
| --------------------------- | ------------------------------------ | ------------------------------------------------- |
| `method`                    | `string`                             | HTTP method.                                      |
| `url`                       | `string`                             | Request URL as a string.                          |
| `headers`                   | `Headers`                            | Request headers (read-only on incoming requests). |
| `signal`                    | `AbortSignal`                        | Abort signal associated with this request.        |
| `body`                      | `ReadableStream<Uint8Array> \| null` | Request body stream.                              |
| `bodyUsed`                  | `boolean`                            | Whether the body has already been consumed.       |
| `clone()`                   | `() => Request`                      | Creates a copy of the request.                    |
| `text()`                    | `() => Promise<string>`              | Reads body as a string.                           |
| `json()`                    | `() => Promise<any>`                 | Reads body and parses as JSON.                    |
| `arrayBuffer()`             | `() => Promise<ArrayBuffer>`         | Reads body as an `ArrayBuffer`.                   |
| `blob()`                    | `() => Promise<Blob>`                | Reads body as a `Blob`.                           |
| `formData()`                | `() => Promise<FormData>`            | Reads body as `FormData`.                         |

**Note:** The `headers` property on an incoming `request` object (from `event.request`) is immutable — calls to `append`, `set`, or `delete` will throw. Clone the request or construct a new `Headers` object to modify headers.

#### `Response`

```typescript
new Response(body?: BodyInit | null, init?: ResponseInit): Response
Response.redirect(url: string | URL, status?: number): Response
Response.json(data: any, init?: ResponseInit): Response
```

| `ResponseInit` field | Type          | Description                          |
| -------------------- | ------------- | ------------------------------------ |
| `status`             | `number`      | HTTP status code. Defaults to `200`. |
| `statusText`         | `string`      | HTTP status text.                    |
| `headers`            | `HeadersInit` | Response headers.                    |

| `Response` property / method | Type                                 | Description                                 |
| ---------------------------- | ------------------------------------ | ------------------------------------------- |
| `status`                     | `number`                             | HTTP status code.                           |
| `statusText`                 | `string`                             | HTTP status text.                           |
| `ok`                         | `boolean`                            | `true` if status is in the range 200–299.   |
| `redirected`                 | `boolean`                            | `true` if the response was redirected.      |
| `url`                        | `string`                             | URL of the response.                        |
| `type`                       | `ResponseType`                       | Response type (e.g., `"basic"`, `"cors"`).  |
| `headers`                    | `Headers`                            | Response headers.                           |
| `body`                       | `ReadableStream<Uint8Array> \| null` | Response body stream.                       |
| `bodyUsed`                   | `boolean`                            | Whether the body has already been consumed. |
| `text()`                     | `() => Promise<string>`              | Reads body as a string.                     |
| `json()`                     | `() => Promise<any>`                 | Reads body and parses as JSON.              |
| `arrayBuffer()`              | `() => Promise<ArrayBuffer>`         | Reads body as an `ArrayBuffer`.             |
| `blob()`                     | `() => Promise<Blob>`                | Reads body as a `Blob`.                     |
| `formData()`                 | `() => Promise<FormData>`            | Reads body as `FormData`.                   |

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
| `getSetCookie()`      | `() => string[]`                                                            |
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

| Method                | Signature                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `get(name)`           | `(name: string) => string \| null`                                                         |
| `getAll(name)`        | `(name: string) => string[]`                                                               |
| `has(name)`           | `(name: string) => boolean`                                                                |
| `set(name, value)`    | `(name: string, value: string) => void`                                                    |
| `append(name, value)` | `(name: string, value: string) => void`                                                    |
| `delete(name)`        | `(name: string) => void`                                                                   |
| `sort()`              | `() => void`                                                                               |
| `entries()`           | `() => IterableIterator<[string, string]>`                                                 |
| `keys()`              | `() => IterableIterator<string>`                                                           |
| `values()`            | `() => IterableIterator<string>`                                                           |
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

To read a byte stream with a caller-supplied buffer, call `getReader({ mode: 'byob' })` which returns a `ReadableStreamBYOBReader`. The BYOB reader's `read(view)` method fills the provided `ArrayBufferView` in-place.

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

#### Queuing Strategies

Two built-in queuing strategies control backpressure. Both accept `{ highWaterMark: number }`.

```typescript
new ByteLengthQueuingStrategy(init: QueuingStrategyInit): ByteLengthQueuingStrategy
new CountQueuingStrategy(init: QueuingStrategyInit): CountQueuingStrategy
```

| Strategy                    | Counts                                      |
| --------------------------- | ------------------------------------------- |
| `ByteLengthQueuingStrategy` | Byte length of each `ArrayBufferView` chunk |
| `CountQueuingStrategy`      | Each chunk as a single unit                 |

#### Compression Streams

```typescript
new CompressionStream(format: CompressionFormat): CompressionStream
new DecompressionStream(format: CompressionFormat): DecompressionStream
```

`CompressionFormat` is one of `"deflate"`, `"deflate-raw"`, or `"gzip"`. Both implement the transform-stream shape (`readable` / `writable`) and can be piped directly with `pipeThrough`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const upstream   = await fetch("https://origin.example.com/data");
  const compressed = upstream.body.pipeThrough(new CompressionStream("gzip"));

  return new Response(compressed, {
    headers: {
      "content-type":     upstream.headers.get("content-type") ?? "application/octet-stream",
      "content-encoding": "gzip",
    },
  });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### Encoding API

#### `TextEncoder` / `TextDecoder`

Standard `TextEncoder` and `TextDecoder` are available as globals for converting between strings and `Uint8Array`.

```javascript
const encoded = new TextEncoder().encode("hello");    // Uint8Array
const decoded = new TextDecoder().decode(encoded);    // "hello"
```

`TextDecoder` accepts an optional encoding label (default `"utf-8"`) and options `{ fatal?: boolean, ignoreBOM?: boolean }`. `TextEncoder` always encodes as UTF-8 and additionally exposes `encodeInto(source, destination)` which writes into a pre-allocated `Uint8Array` and returns `{ read, written }`.

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

### File API

#### `Blob`

```typescript
new Blob(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob
```

`BlobPart` is `BufferSource | Blob | string`. `BlobPropertyBag` accepts `{ type?: string, endings?: "native" | "transparent" }`.

| `Blob` property / method            | Type / Signature                                               | Description                              |
| ----------------------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `size`                              | `number`                                                       | Total byte length.                       |
| `type`                              | `string`                                                       | MIME type string.                        |
| `arrayBuffer()`                     | `() => Promise<ArrayBuffer>`                                   | Reads content as an `ArrayBuffer`.       |
| `bytes()`                           | `() => Promise<Uint8Array>`                                    | Reads content as a `Uint8Array`.         |
| `text()`                            | `() => Promise<string>`                                        | Reads content as a UTF-8 string.         |
| `stream()`                          | `() => ReadableStream<Uint8Array>`                             | Returns a `ReadableStream` of the bytes. |
| `slice(start?, end?, contentType?)` | `(start?: number, end?: number, contentType?: string) => Blob` | Returns a sub-blob.                      |

#### `File`

```typescript
new File(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File
```

`File` extends `Blob` and adds:

| Property       | Type     | Description                               |
| -------------- | -------- | ----------------------------------------- |
| `name`         | `string` | File name as provided to the constructor. |
| `lastModified` | `number` | Last modified timestamp in milliseconds.  |

#### `FormData`

```typescript
new FormData(): FormData
```

`FormDataEntryValue` is `File | string`.

| Method                | Signature                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `append(name, value)` | `(name: string, value: string \| Blob, fileName?: string) => void`                       |
| `delete(name)`        | `(name: string) => void`                                                                 |
| `get(name)`           | `(name: string) => FormDataEntryValue \| null`                                           |
| `getAll(name)`        | `(name: string) => FormDataEntryValue[]`                                                 |
| `has(name)`           | `(name: string) => boolean`                                                              |
| `set(name, value)`    | `(name: string, value: string \| Blob, fileName?: string) => void`                       |
| `forEach(callback)`   | `(callback: (value: FormDataEntryValue, key: string, parent: FormData) => void) => void` |
| `entries()`           | `() => IterableIterator<[string, FormDataEntryValue]>`                                   |
| `keys()`              | `() => IterableIterator<string>`                                                         |
| `values()`            | `() => IterableIterator<FormDataEntryValue>`                                             |

---

### Abort API

#### `AbortController` / `AbortSignal`

```typescript
new AbortController(): AbortController
```

| `AbortController` member | Type / Signature         | Description                          |
| ------------------------ | ------------------------ | ------------------------------------ |
| `signal`                 | `AbortSignal`            | The associated signal object.        |
| `abort(reason?)`         | `(reason?: any) => void` | Triggers the signal's aborted state. |

| `AbortSignal` member         | Type / Signature                          | Description                                         |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------- |
| `aborted`                    | `boolean`                                 | Whether the signal has been aborted.                |
| `reason`                     | `any`                                     | The abort reason, if any.                           |
| `onabort`                    | `((ev: Event) => any) \| null`            | Event handler fired when the signal aborts.         |
| `throwIfAborted()`           | `() => void`                              | Throws the abort reason if the signal is aborted.   |
| `AbortSignal.abort(reason?)` | `(reason?: any) => AbortSignal`           | Returns an already-aborted signal.                  |
| `AbortSignal.timeout(ms)`    | `(milliseconds: number) => AbortSignal`   | Returns a signal that aborts after the given delay. |
| `AbortSignal.any(signals)`   | `(signals: AbortSignal[]) => AbortSignal` | Returns a signal that aborts when any input aborts. |

Pass a signal via `RequestInit.signal` to cancel an in-flight `fetch`:

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  try {
    const response = await fetch("https://slow-origin.example.com/data", {
      signal: AbortSignal.timeout(5000),
    });
    return new Response(await response.text(), { status: 200 });
  } catch (err) {
    return new Response("upstream timeout", { status: 504 });
  }
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

| Method      | Signature                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `digest`    | `(algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>`                                                     |
| `importKey` | See overloads below                                                                                                                |
| `sign`      | `(algorithm: AlgorithmIdentifier \| EcdsaParams, key: CryptoKey, data: BufferSource) => Promise<ArrayBuffer>`                      |
| `verify`    | `(algorithm: AlgorithmIdentifier \| EcdsaParams, key: CryptoKey, signature: BufferSource, data: BufferSource) => Promise<boolean>` |

Supported algorithms:

| Operation   | Algorithms                               |
| ----------- | ---------------------------------------- |
| `digest`    | `SHA-1`, `SHA-256`, `SHA-384`, `SHA-512` |
| `sign`      | `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`    |
| `verify`    | `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`    |
| `importKey` | `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`    |

`importKey` overloads:

```typescript
// JWK format
subtle.importKey(
  format: 'jwk',
  keyData: JsonWebKey,
  algorithm: AlgorithmIdentifier | HmacImportParams | RsaHashedImportParams | EcKeyImportParams,
  extractable: boolean,
  keyUsages: ReadonlyArray<KeyUsage>,
): Promise<CryptoKey>

// Raw / SPKI / PKCS#8 formats
subtle.importKey(
  format: Exclude<KeyFormat, 'jwk'>,
  keyData: BufferSource,
  algorithm: AlgorithmIdentifier | HmacImportParams | RsaHashedImportParams | EcKeyImportParams,
  extractable: boolean,
  keyUsages: KeyUsage[],
): Promise<CryptoKey>
```

Supported `(algorithm, format)` combinations:

| Algorithm           | Supported formats                      |
| ------------------- | -------------------------------------- |
| `HMAC`              | `'raw'`, `'jwk'`                       |
| `RSASSA-PKCS1-v1_5` | `'jwk'`, `'spki'`, `'pkcs8'`           |
| `ECDSA`             | `'jwk'`, `'raw'`, `'spki'`, `'pkcs8'` |

`ECDSA` requires `EcdsaParams` (`{ name: 'ECDSA', hash: AlgorithmIdentifier }`) for `sign` and `verify` so that the hash function can be specified.

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

### DOM Events

The standard `Event`, `EventTarget`, and `CustomEvent` interfaces are available as globals. These underpin the `FetchEvent` mechanism and can be used to implement custom event dispatch within an application.

```typescript
new Event(type: string, eventInitDict?: EventInit): Event
new CustomEvent<T>(type: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>
new EventTarget(): EventTarget
```

`EventTarget` exposes `addEventListener`, `removeEventListener`, and `dispatchEvent`. `CustomEvent` extends `Event` and adds a `detail` property carrying application-defined data.

---

### Additional Globals

| Global                          | Type / Signature                                            | Description                                       |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `self`                          | `typeof globalThis`                                         | Reference to the global object.                   |
| `location`                      | `WorkerLocation`                                            | URL of the current worker script.                 |
| `queueMicrotask(callback)`      | `(callback: () => void) => void`                            | Queues a microtask.                               |
| `structuredClone(value, opts?)` | `(value: any, options?: StructuredSerializeOptions) => any` | Deep-clones a value. Transferable: `ArrayBuffer`. |

`WorkerLocation` exposes `href`, `origin`, `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, and `hash` as read-only string properties.

---

## See Also

- [quickstart.md](quickstart.md) — Getting started with your first FastEdge application
- [BUILD_CLI.md](BUILD_CLI.md) — `fastedge-build` CLI reference
- [INIT_CLI.md](INIT_CLI.md) — `fastedge-init` CLI reference
- [STATIC_SITES.md](STATIC_SITES.md) — Serving static assets from WASM
- [ASSETS_CLI.md](ASSETS_CLI.md) — `fastedge-assets` CLI reference
