# SDK Runtime API

APIs available inside your FastEdge WebAssembly application at runtime. These are provided by the StarlingMonkey JavaScript engine and custom FastEdge builtins.

## FastEdge APIs

These are imported from special `fastedge::` module specifiers that resolve at runtime inside the WASM environment.

### Environment Variables

```js
import { getEnv } from 'fastedge::env';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `getEnv` | `(name: string) => string \| null` | Get an environment variable by name. Returns `null` if not set. |

Environment variables are set during deployment configuration, not at build time.

```js
const region = getEnv('REGION');
const apiUrl = getEnv('API_BASE_URL');
```

### Secrets

```js
import { getSecret, getSecretEffectiveAt } from 'fastedge::secret';
```

| Function | Signature | Description |
|----------|-----------|-------------|
| `getSecret` | `(name: string) => string \| null` | Get the current (max slot) secret value |
| `getSecretEffectiveAt` | `(name: string, effectiveAt: number) => string \| null` | Get a secret by slot index or timestamp |

Secrets are configured at deployment time and retrieved securely at runtime.

```js
// Get current secret
const apiKey = getSecret('API_KEY');

// Get secret by slot index
const oldKey = getSecretEffectiveAt('API_KEY', 0);

// Timestamp-based rollover
const key = getSecretEffectiveAt('API_KEY', Date.now());
```

### KV Store

```js
import { KvStore } from 'fastedge::kv';
```

#### Opening a Store

| Method | Signature | Description |
|--------|-----------|-------------|
| `KvStore.open` | `(name: string) => KvStoreInstance` | Open a named KV store |

```js
const store = KvStore.open('my-store');
```

#### KvStoreInstance Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `(key: string) => ArrayBuffer \| null` | Get a value by key |
| `scan` | `(pattern: string) => Array<ArrayBuffer>` | Scan keys matching pattern (prefix with `*` wildcard) |
| `zrangeByScore` | `(key: string, min: number, max: number) => Array<[ArrayBuffer, number]>` | Sorted set range query |
| `zscan` | `(key: string, pattern: string) => Array<[ArrayBuffer, number]>` | Sorted set scan |
| `bfExists` | `(key: string, value: string) => boolean` | Bloom filter membership check |

**Note:** `get` and `scan` return `ArrayBuffer` values. Use `TextDecoder` to convert to strings:

```js
const store = KvStore.open('my-store');
const value = store.get('user:123');

if (value) {
  const text = new TextDecoder().decode(value);
  const data = JSON.parse(text);
}
```

#### KV Store Examples

```js
// Key lookup
const value = store.get('config:theme');

// Prefix scan
const keys = store.scan('user:*');

// Sorted set: get items scored between 0 and 100
const results = store.zrangeByScore('leaderboard', 0, 100);
for (const [value, score] of results) {
  console.log(`Score: ${score}, Value: ${new TextDecoder().decode(value)}`);
}

// Bloom filter: probabilistic membership test
const exists = store.bfExists('email-blocklist', 'spam@example.com');
```

## Web APIs

The StarlingMonkey runtime provides standard Web APIs:

### Fetch API

| API | Description |
|-----|-------------|
| `fetch(input, init?)` | Make outbound HTTP requests |
| `Request` | HTTP request constructor |
| `Response` | HTTP response constructor |
| `Headers` | HTTP headers (get, set, has, delete, forEach, entries) |

```js
// Outbound fetch
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
});
```

#### Request Constructor

```js
new Request(input, options?)
```

| Option | Type | Description |
|--------|------|-------------|
| `method` | `string` | HTTP method |
| `headers` | `Headers \| object` | Request headers |
| `body` | `string \| ArrayBuffer \| TypedArray \| DataView \| URLSearchParams \| ReadableStream` | Request body |

#### Response Constructor

```js
new Response(body?, options?)
```

| Option | Type | Description |
|--------|------|-------------|
| `status` | `number` | HTTP status code |
| `statusText` | `string` | Status text |
| `headers` | `Headers \| object` | Response headers |

#### Headers Immutability

Headers on received `Request` and `Response` objects are immutable. To modify, create a new `Headers` object:

```js
const newHeaders = new Headers(request.headers);
newHeaders.set('X-Custom', 'value');
const newRequest = new Request(request, { headers: newHeaders });
```

### URL APIs

| API | Description |
|-----|-------------|
| `URL` | URL parsing and manipulation |
| `URLSearchParams` | Query string handling |

### Streams API

| API | Description |
|-----|-------------|
| `ReadableStream` | Readable byte streams |
| `WritableStream` | Writable byte streams |
| `TransformStream` | Transform streams |

### Encoding

| API | Description |
|-----|-------------|
| `TextEncoder` | Encode strings to UTF-8 bytes |
| `TextDecoder` | Decode bytes to strings |
| `atob(data)` | Decode base64 string |
| `btoa(data)` | Encode to base64 string |

### Timers

| API | Description |
|-----|-------------|
| `setTimeout(fn, ms)` | Schedule delayed execution |
| `clearTimeout(id)` | Cancel timeout |
| `setInterval(fn, ms)` | Schedule repeated execution |
| `clearInterval(id)` | Cancel interval |

### Crypto

| API | Description |
|-----|-------------|
| `crypto.getRandomValues(array)` | Cryptographic random numbers |
| `crypto.randomUUID()` | Generate UUID v4 |
| `crypto.subtle` | SubtleCrypto for hashing, signing, encryption |

### Other Globals

| API | Description |
|-----|-------------|
| `console` | Logging (log, warn, error, info, debug) |
| `performance.now()` | High-resolution timer |
| `performance.timeOrigin` | Time origin |

## FetchEvent

The event passed to your `addEventListener('fetch', ...)` handler:

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `event.request` | `Request` | The incoming HTTP request |
| `event.client` | `ClientInfo` | Client connection info |
| `event.respondWith(response)` | `void` | Must be called synchronously with a `Response` or `Promise<Response>` |

### ClientInfo

| Property | Type | Description |
|----------|------|-------------|
| `client.geo` | `GeoData` | Geolocation data |
| `client.address` | `string` | Client IP address |

### GeoData

| Property | Type | Description |
|----------|------|-------------|
| `geo.asn` | `number` | Autonomous System Number |
| `geo.city` | `string` | City name |
| `geo.country` | `string` | Country name |
| `geo.countryCode` | `string` | ISO country code |
| `geo.continent` | `string` | Continent code |
| `geo.latitude` | `string` | Latitude |
| `geo.longitude` | `string` | Longitude |
| `geo.region` | `string` | Region name |
| `geo.regionCode` | `string` | Region code |

## See Also

- [Quickstart](quickstart.md) — getting started with examples
- [INDEX](INDEX.md) — documentation overview
- [TypeScript Declarations](https://github.com/G-Core/FastEdge-sdk-js/tree/main/types) — authoritative type definitions
