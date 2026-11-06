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

Retrieves the value of a named environment variable, or `null` if not set.

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

Retrieves the value of a named secret variable, or `null` if not set.

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

Retrieves the value of a named secret from a specific slot, or `null` if not set. The `effectiveAt` parameter is the slot index of the secret (`effectiveAt >= secret_slots.slot`). It is converted to a 32-bit integer; negative values are treated as `0`. Slot indices can also be Unix timestamps.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { getSecretEffectiveAt } from "fastedge::secret";

async function app(event) {
  // Using a slot index
  const password = getSecretEffectiveAt("PASSWORD", 1);

  // Using a slot index that is a Unix timestamp
  const token = getSecretEffectiveAt("API_TOKEN", 1745698356);

  return new Response(`${password !== null} ${token !== null}`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### KV Store

**Module:** `fastedge::kv`

```typescript
import { KvStore } from "fastedge::kv";
```

The `KvStore` class provides access to key-value stores attached to the application. Open a store by name using the static `open` method, then use the returned instance to query data. The SDK provides read access only; there is no write API.

`KvStore` is globally replicated with eventual consistency. It is suited to globally-shared configuration, lookup tables, and sorted sets. For strongly-consistent, POP-local storage with atomic counter primitives, see [Cache](#cache) below.

Each read operation is available in two shapes: raw-bytes methods that return values synchronously as `ArrayBuffer`, and entry-style methods that return `KvStoreEntry` objects asynchronously. Both are supported APIs.

#### `KvStore.open`

```typescript
static open(name: string): KvStoreInstance
```

Opens a named KV store and returns an instance. The `name` is the name of the KV store as defined on the application.

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

Retrieves the value for a key as an `ArrayBuffer`. Returns `null` if the key does not exist. The returned `ArrayBuffer` can be decoded with `TextDecoder` for string values.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv  = KvStore.open("my-store");
  const buf = kv.get("my-key");

  if (buf === null) {
    return new Response("not found", { status: 404 });
  }

  return new Response(new TextDecoder().decode(buf), { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `getEntry`

Retrieves the value for a key as a `KvStoreEntry` with `text()`, `json()`, and `arrayBuffer()` accessors. Use this when you want to decode the value as a string or JSON without manual `TextDecoder` work. Resolves to `null` if the key is not present.

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
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv   = KvStore.open("my-store");
  const keys = kv.scan("user:*");
  // keys: Array<string> — e.g. ["user:1", "user:2"]

  return Response.json(keys, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `zrangeByScore`

Returns all entries from a sorted set (ZSet) with scores between `min` and `max`. Each entry is a `[value, score]` tuple where `value` is an `ArrayBuffer`. Returns an empty array if no entries fall in range.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv      = KvStore.open("my-store");
  const entries = kv.zrangeByScore("leaderboard", 100, 500);

  const rows = entries.map(([buf, score]) => ({
    name: new TextDecoder().decode(buf),
    score,
  }));

  return Response.json(rows, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv      = KvStore.open("my-store");
  const entries = kv.zscan("leaderboard", "user:*");

  const rows = entries.map(([buf, score]) => ({
    name: new TextDecoder().decode(buf),
    score,
  }));

  return Response.json(rows, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

Checks whether a value exists in the Bloom Filter stored under the given key. Returns `true` if the value exists, `false` otherwise.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvStore } from "fastedge::kv";

async function app(event) {
  const kv   = KvStore.open("my-store");
  const seen = kv.bfExists("visited-ips", event.client.address);

  return new Response(seen ? "seen" : "new", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### Cache

**Module:** `fastedge::cache`

```typescript
import { Cache } from "fastedge::cache";
```

`Cache` is a POP-local key/value store with TTL and atomic counter primitives. It is strongly consistent within a single point-of-presence and independent across POPs. It is intended for transient, request-time state: rate limiting, hit counters, response memoisation, and deduplicated work. A value written from one data center is not visible to another.

Values are stored as raw bytes. The cache does not record what type was originally passed; on read, decode with whichever `CacheEntry` accessor you need (`text`, `json`, `arrayBuffer`).

**`Cache` vs `KvStore` at a glance:**

| Concern           | `Cache`                                      | `KvStore`                                 |
| ----------------- | -------------------------------------------- | ----------------------------------------- |
| Consistency scope | Strong within a POP; independent across POPs | Eventual; globally replicated             |
| Atomic operations | `incr`, `decr`, `getOrSet` coalescing        | Not available                             |
| Typical use cases | Rate limits, counters, request coalescing    | Configuration, lookup tables, sorted sets |
| Data persistence  | Transient; subject to host eviction          | Replicated across data centers            |

Strong per-POP consistency makes `Cache.incr` / `Cache.decr` reliable for per-POP rate limits. `Cache.getOrSet` coalesces concurrent calls for the same key within a single WASM instance, so concurrent origin fetches are deduplicated at that scope. For globally-shared data that must be visible across all POPs, use `fastedge::kv`.

#### CacheValue

Values accepted by `Cache.set` and the `populate` callback of `Cache.getOrSet`:

```typescript
type CacheValue = string | ArrayBuffer | ArrayBufferView | ReadableStream | Response;
```

All forms are coerced to raw bytes before storage:

- `string` — encoded as UTF-8.
- `ArrayBuffer` / `ArrayBufferView` — used directly.
- `ReadableStream` — fully consumed, then stored as a single byte buffer.
- `Response` — `response.arrayBuffer()` is consumed; status and headers are discarded. The cache stores bytes only. To round-trip status or headers, encode them into the value (e.g., as a JSON envelope).

#### WriteOptions

Controls how long a cache entry lives. Pass exactly one of `ttl`, `ttlMs`, or `expiresAt`. Passing more than one, an options value that is not an object (`null` and `undefined` mean no options), or a value that resolves to a TTL that is not positive (zero, negative, non-finite, or an `expiresAt` in the past) or not below `Number.MAX_SAFE_INTEGER` ms throws an `Error`. For `set` and `getOrSet`, if the options bag is omitted or empty, the entry has no expiry and persists until explicitly deleted (subject to the host's eviction policy).

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

All methods are static; `Cache` is never constructed. Every method returns a `Promise`.

Operational errors from the host (access denied, internal error, implementation-specific I/O) surface as Promise rejections. Invalid `WriteOptions` throw an `Error` synchronously; a non-function `populate` and an invalid `delta` (non-finite, non-integer, or beyond ±`Number.MAX_SAFE_INTEGER`) also throw synchronously. A `set` value of an unsupported type rejects the returned Promise instead. Keys are converted with `String()`; ordinary values never cause an error. Both forms are caught the same way by `try`/`catch` around an `await`.

| Method                              | Signature                                                                                                                                 | Returns                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `get(key)`                          | `(key: string) => Promise<CacheEntry \| null>`                                                                                            | `Promise<CacheEntry \| null>` |
| `exists(key)`                       | `(key: string) => Promise<boolean>`                                                                                                       | `Promise<boolean>`            |
| `set(key, value, options?)`         | `(key: string, value: CacheValue, options?: WriteOptions) => Promise<void>`                                                               | `Promise<void>`               |
| `delete(key)`                       | `(key: string) => Promise<void>`                                                                                                          | `Promise<void>`               |
| `expire(key, options)`              | `(key: string, options: WriteOptions) => Promise<boolean>`                                                                                | `Promise<boolean>`            |
| `incr(key, delta?)`                 | `(key: string, delta?: number) => Promise<number>`                                                                                        | `Promise<number>`             |
| `decr(key, delta?)`                 | `(key: string, delta?: number) => Promise<number>`                                                                                        | `Promise<number>`             |
| `getOrSet(key, populate, options?)` | `(key: string, populate: () => CacheValue \| Promise<CacheValue>, options?: WriteOptions) => Promise<CacheEntry>`                         | `Promise<CacheEntry>`         |
| `getOrSet(key, populate, options?)` | `(key: string, populate: () => CacheValue \| null \| Promise<CacheValue \| null>, options?: WriteOptions) => Promise<CacheEntry \| null>` | `Promise<CacheEntry \| null>` |
| `purge()`                           | `() => Promise<number>`                                                                                                                   | `Promise<number>`             |
| `purgePrefix(prefix)`               | `(prefix: string) => Promise<number>`                                                                                                     | `Promise<number>`             |

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

Returns `true` if `key` exists in the cache. Cheaper than `get` when you only need presence, as the value is not transferred.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const present = await Cache.exists("feature-flag:beta");

  return new Response(present ? "enabled" : "disabled", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `set`

Stores `value` under `key`, optionally with an expiry. Overwrites any existing value at `key`. Pass an empty options bag, or omit `options`, to store with no expiry.

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
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  await Cache.delete("session:abc");

  return new Response("deleted", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `expire`

Updates the expiry of an existing key. Resolves to `true` if the expiry was set, `false` if the key does not exist. `options` must set one of `ttl`, `ttlMs`, or `expiresAt`; omitting it, or passing an empty object, throws an `Error`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const updated = await Cache.expire("rl:1.2.3.4", { ttl: 60 });

  return new Response(updated ? "expiry set" : "no such key", { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `incr` and `decr`

Atomically increment or decrement the integer at `key` by `delta` (default `1`). If the key does not exist, it is initialised to `0` before the operation. Resolves to the new value. Rejects if the stored value at `key` is not an integer.

`Cache.decr` is sugar for `Cache.incr(key, -(delta ?? 1))`. `delta` may be negative; prefer `decr` when subtracting for readability. Integer values larger than `Number.MAX_SAFE_INTEGER` (2^53 − 1) are not represented exactly.

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

Returns the entry for `key`, or calls `populate` on a cache miss and stores the resolved value under `key` with the supplied `options`. Concurrent callers for the same key in the same WASM instance share one `populate` execution; `populate` is not re-run for joiners.

**Coalescing scope:** in-process only. Concurrent requests handled by other WASM instances, including other workers in the same POP, race independently and may each run `populate`.

**Errors:** if `populate` throws or its Promise rejects, the rejection propagates to all current waiters. The next call after the rejection retries `populate` (no negative caching).

**Skip-cache signal:** if `populate` resolves with `null`, the value is _not_ written to the cache and `getOrSet` resolves with `null`. Use this to wrap fallible work and only pin successes — for example, caching only `response.ok` upstream fetches so that a transient 5xx is not held for the rest of the TTL window. To also surface the original error response to the caller, use a manual `Cache.get` + conditional `Cache.set` instead.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const url = new URL(event.request.url);

  // Cache only successful upstream responses; null skips the write.
  const entry = await Cache.getOrSet(
    `proxy:${url.pathname}`,
    async () => {
      const r = await fetch(`https://origin.example.com${url.pathname}`);
      return r.ok ? r : null;
    },
    { ttl: 30 },
  );

  if (entry === null) {
    return Response.json({ error: "upstream unavailable" }, { status: 503 });
  }

  return new Response(await entry.arrayBuffer(), {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `purge`

Purges all cache entries available to this application. The host scans the key index, deletes every cached key, and removes the index itself. Resolves with the number of keys deleted.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  const deleted = await Cache.purge();
  return Response.json({ purged: deleted });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### `purgePrefix`

Purges all cache entries whose keys begin with `prefix`. The host scans the key index for keys that begin with the given prefix, deletes every matched key, and removes the matched entries from the index (the index itself is kept for any remaining keys). Resolves with the number of keys deleted.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { Cache } from "fastedge::cache";

async function app(event) {
  // Invalidate all cached user profiles after a bulk update
  const deleted = await Cache.purgePrefix("user:");
  return Response.json({ purged: deleted });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

## Databases

A `gcore:db` database is a database the customer owns, bound to the application by name (for example `"main"`). The host holds the connection details; the application only knows the binding name and opens the database with that name. Two database types are available: SQL and key-value. SQL has two modules over the same classes: the dialect-neutral `fastedge::db/sql`, and `fastedge::db/postgres`, the same API under PostgreSQL names.

| Database type | Module                                                           | Class                                                          |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| SQL           | `fastedge::db/sql` (or `fastedge::db/postgres` for PostgreSQL)   | `SqlDatabase`, or `PostgresDatabase` for a PostgreSQL database |
| KV            | `fastedge::db/kv`                                                | `KvDatabase` (regional, durable, writable)                     |

All database calls return Promises. `open` is synchronous and throws on error. Calls start at once and run concurrently with each other and with `fetch`, so `Promise.all` of several calls takes about one round trip. Calls that are not awaited may run in any order: await a write before relying on it, and use `batch` for ordered or atomic work.

### Choosing a Store

| Store                    | Module            | Scope                    | Writable from the app | Use when                                                        |
| ------------------------ | ----------------- | ------------------------ | --------------------- | --------------------------------------------------------------- |
| `KvStore` (Edge Storage) | `fastedge::kv`    | Replicated to every edge | No                    | Read-only global configuration, lookup tables, sorted sets      |
| `Cache`                  | `fastedge::cache` | POP-local                | Yes                   | Transient per-POP state: rate limits, counters, memoisation     |
| `KvDatabase`             | `fastedge::db/kv` | Regional, durable        | Yes                   | Durable, writable state such as counters and rate-limit windows |

### Binding a Database

The application opens a database by name (for example `SqlDatabase.open("main")`). The name is bound to a database in the application's configuration, outside the code; the application never sees the connection details. Opening a name with no binding throws an error with `kind: 'config'`. Schema migrations are applied from outside the application (for example from a developer machine or CI), not from application code.

---

### SQL

**Module:** `fastedge::db/sql`

```typescript
import { SqlDatabase, SqlError } from "fastedge::db/sql";
```

`SqlDatabase` is dialect-neutral: SQL text, placeholders, and error codes are those of the bound database (`$1`, `$2`, ... for PostgreSQL). The connection details stay with the host.

```typescript
class SqlDatabase {
  static open(name: string): SqlDatabase;

  query<T = Record<string, SqlValue>>(
    sql: string,
    params?: SqlParam[],
    options?: SqlQueryOptions,
  ): Promise<SqlResult<T>>;

  batch(statements: SqlStatement[], options?: SqlQueryOptions): Promise<SqlResult[]>;
}
```

- `open(name)` opens the database bound to `name`. It throws `SqlError` with `kind: 'config'` if no database is bound to `name`.
- `query(sql, params?, options?)` runs one statement with positional parameters and auto-commits. `T` is not checked at runtime.
- `batch(statements, options?)` runs several statements in one transaction: all commit or none do. It returns one result per statement, in order.

`query` and `batch` start at once and run concurrently with each other and with `fetch`. Calls that are not awaited may run in any order: await a write before relying on it, and use `batch` for ordered or atomic work.

#### Types

```typescript
type SqlParam = null | undefined | boolean | number | bigint | string | Uint8Array | Date | object;
type SqlJson = null | boolean | number | string | SqlJson[] | { [key: string]: SqlJson };
type SqlValue = SqlJson | Uint8Array;
```

`SqlParam` conversion:

- `bigint` is sent as `int8`, `Uint8Array` as `bytea`.
- `Date` is sent as ISO-8601 text, any other object as JSON text.
- Everything else is sent as text and cast by the database.

`SqlResult<T>`:

| Field      | Type          | Description                                                |
| ---------- | ------------- | ---------------------------------------------------------- |
| `rows`     | `T[]`         | Rows as objects, or arrays with `rowMode: 'array'`.        |
| `rowCount` | `number`      | Rows returned (SELECT) or affected (INSERT/UPDATE/DELETE). |
| `columns`  | `SqlColumn[]` | One descriptor per result column.                          |

`SqlColumn`:

| Field      | Type     | Description                                                                      |
| ---------- | -------- | -------------------------------------------------------------------------------- |
| `name`     | `string` | Column name or alias.                                                            |
| `typeName` | `string` | Database type name, lower case, e.g. `'int4'`; empty if the host cannot name it. |

`SqlStatement`:

| Field    | Type         | Description                     |
| -------- | ------------ | ------------------------------- |
| `sql`    | `string`     | The statement text.             |
| `params` | `SqlParam[]` | Optional positional parameters. |

`SqlQueryOptions`:

| Field     | Type                  | Description                                                 |
| --------- | --------------------- | ----------------------------------------------------------- |
| `rowMode` | `'object' \| 'array'` | `'array'` returns arrays in column order. Default: objects. |

The result-value mapping for PostgreSQL is listed under [PostgreSQL](#postgresql).

#### SqlError

`SqlError` extends `Error` and has `name` `'SqlError'`. It is thrown by `open` and is the rejection reason for `query` and `batch`. `code`, `detail`, `hint`, and `constraint` are optional.

| Property     | Type           | Description                                             |
| ------------ | -------------- | ------------------------------------------------------- |
| `kind`       | `SqlErrorKind` | Error category; see the table below.                    |
| `code`       | `string`       | Database error code; the SQLSTATE for PostgreSQL.       |
| `detail`     | `string`       | Additional detail from the database.                    |
| `hint`       | `string`       | A hint from the database.                               |
| `constraint` | `string`       | Name of the violated constraint, for constraint errors. |

`code` is set for most `query` errors (for example `'23505'`, a unique violation in PostgreSQL).

| Kind            | Meaning                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `config`        | Unknown binding, bad credentials, or database name.                                       |
| `access-denied` | Access to the database was denied.                                                        |
| `connection`    | The database could not be reached.                                                        |
| `timeout`       | The call exceeded the host's time limit; the statement may or may not have been applied.  |
| `limit`         | A host or backend limit was exceeded (response size, statements per batch, sub-requests). |
| `query`         | The database rejected the statement; see `code`.                                          |
| `internal`      | Internal error.                                                                           |

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { SqlDatabase, SqlError } from "fastedge::db/sql";

async function app(event) {
  const db = SqlDatabase.open("main");
  try {
    const { rows } = await db.query("select id, email from users where id = $1", [42]);
    return Response.json(rows[0] ?? null);
  } catch (error) {
    if (error instanceof SqlError && error.kind === "query") {
      return new Response(`Query failed: ${error.code}`, { status: 500 });
    }
    throw error;
  }
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

Use `batch` to run statements in one transaction, and `rowMode: "array"` to receive each row as an array in column order:

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { SqlDatabase } from "fastedge::db/sql";

async function app(event) {
  const db = SqlDatabase.open("main");

  const [insert, count] = await db.batch(
    [
      { sql: "insert into users (email) values ($1)", params: ["ann@example.com"] },
      { sql: "select count(*) from users" },
    ],
    { rowMode: "array" },
  );

  return Response.json({ inserted: insert.rowCount, total: count.rows[0][0] });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### PostgreSQL

**Module:** `fastedge::db/postgres`

```typescript
import { PostgresDatabase, PostgresError, SQLSTATE } from "fastedge::db/postgres";
```

`PostgresDatabase` is the `fastedge::db/sql` API under PostgreSQL names. Write PostgreSQL (`$1` placeholders, `RETURNING`, `jsonb`). Use this module with a PostgreSQL database.

The host does not check that the binding's database matches the module: `fastedge::db/postgres` names the dialect, it does not verify it. Bind a PostgreSQL database (for example Neon) to the name.

`PostgresDatabase` and `PostgresError` are the same classes as `SqlDatabase` and `SqlError`, so `instanceof` matches either. The `name` of a `PostgresError` is `'SqlError'`.

```typescript
class PostgresDatabase {
  static open(name: string): PostgresDatabase;

  query<T = Record<string, PostgresValue>>(
    sql: string,
    params?: PostgresParam[],
    options?: PostgresQueryOptions,
  ): Promise<PostgresResult<T>>;

  batch(
    statements: PostgresStatement[],
    options?: PostgresQueryOptions,
  ): Promise<PostgresResult[]>;
}
```

`open` throws `PostgresError` with `kind: 'config'` if no database is bound to `name`. `query` runs one statement and auto-commits. `batch` runs several statements in one transaction and returns one result per statement, in order. Calls that are not awaited may run in any order: await a write before relying on it, and use `batch` for ordered or atomic work.

#### Type aliases

| Alias                  | Equivalent in `fastedge::db/sql` |
| ---------------------- | -------------------------------- |
| `PostgresParam`        | `SqlParam`                       |
| `PostgresValue`        | `SqlValue`                       |
| `PostgresJson`         | `SqlJson`                        |
| `PostgresColumn`       | `SqlColumn`                      |
| `PostgresResult<T>`    | `SqlResult<T>`                   |
| `PostgresStatement`    | `SqlStatement`                   |
| `PostgresQueryOptions` | `SqlQueryOptions`                |
| `PostgresErrorKind`    | `SqlErrorKind`                   |

`PostgresSqlState` is the union of the `SQLSTATE` code values listed below.

#### Value mapping

Parameters follow `SqlParam`: `bigint` is sent as `int8`, `Uint8Array` as `bytea`, `Date` as ISO-8601 text, any other object as JSON text, and everything else as text cast by PostgreSQL.

Result values:

| PostgreSQL                                      | JavaScript                              |
| ----------------------------------------------- | --------------------------------------- |
| `int2`, `int4`, `float4`, `float8`              | `number`                                |
| `int8`, `numeric`                               | `string` (no precision loss)            |
| `bool`                                          | `boolean`                               |
| `json`, `jsonb`                                 | parsed value                            |
| `bytea`                                         | `Uint8Array`                            |
| `timestamptz`                                   | `string`, PostgreSQL text format in UTC |
| anything else (dates, uuid, arrays, enums, ...) | `string`, PostgreSQL text format        |
| `NULL`                                          | `null`                                  |

#### Extension and user-defined types

Extension and user-defined types (pgvector `vector`, PostGIS `geometry`, enums, domains) work as text. Send them as text parameters, casting in SQL where PostgreSQL cannot infer the type (for example `order by embedding <-> $1::vector`). They come back as a `string` in PostgreSQL's text format (`"[0.1,0.2]"` for a vector). `SqlColumn.typeName` holds PostgreSQL's name for built-in types (for example `'int4'`, `'timestamptz'`, `'int4[]'`); it is empty for extension and user-defined types.

#### PostgresError and SQLSTATE

`PostgresError` has the same properties as `SqlError`. `code` holds the SQLSTATE; its type autocompletes the codes in `SQLSTATE` and accepts any other string.

```typescript
class PostgresError extends Error {
  readonly name: 'SqlError';
  readonly kind: PostgresErrorKind;
  readonly code?: PostgresSqlState | (string & {});
  readonly detail?: string;
  readonly hint?: string;
  readonly constraint?: string;
}
```

`SQLSTATE` is a constant object of the codes applications commonly branch on (PostgreSQL `errcodes.txt`). Any other code still arrives in `PostgresError.code`.

| Constant                       | Code    | Meaning                                                                           |
| ------------------------------ | ------- | --------------------------------------------------------------------------------- |
| `UNIQUE_VIOLATION`             | `23505` | A unique constraint or index rejected a duplicate.                                |
| `FOREIGN_KEY_VIOLATION`        | `23503` | A foreign key points at a missing row.                                            |
| `NOT_NULL_VIOLATION`           | `23502` | `NULL` in a `NOT NULL` column.                                                    |
| `CHECK_VIOLATION`              | `23514` | A `CHECK` constraint failed.                                                      |
| `EXCLUSION_VIOLATION`          | `23P01` | An exclusion constraint failed.                                                   |
| `INVALID_TEXT_REPRESENTATION`  | `22P02` | Text could not be parsed as the column type (for example `'abc'` for an integer). |
| `NUMERIC_VALUE_OUT_OF_RANGE`   | `22003` | A number out of the column type's range.                                          |
| `STRING_DATA_RIGHT_TRUNCATION` | `22001` | A string longer than the column allows.                                           |
| `DIVISION_BY_ZERO`             | `22012` | Division by zero.                                                                 |
| `UNDEFINED_TABLE`              | `42P01` | The table does not exist (for example migrations not applied).                    |
| `UNDEFINED_COLUMN`             | `42703` | The column does not exist.                                                        |
| `UNDEFINED_FUNCTION`           | `42883` | No function matches the name and argument types.                                  |
| `SYNTAX_ERROR`                 | `42601` | SQL syntax error (for example `?` placeholders instead of `$1`).                  |
| `INSUFFICIENT_PRIVILEGE`       | `42501` | The database role lacks a privilege.                                              |
| `SERIALIZATION_FAILURE`        | `40001` | Serialization failure; the transaction may be retried.                            |
| `DEADLOCK_DETECTED`            | `40P01` | Deadlock detected; the transaction may be retried.                                |
| `QUERY_CANCELED`               | `57014` | The statement was cancelled (for example `statement_timeout`).                    |
| `INVALID_PASSWORD`             | `28P01` | Wrong password for the database role (`kind: 'config'`).                          |
| `INVALID_CATALOG_NAME`         | `3D000` | The database does not exist (`kind: 'config'`).                                   |

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { PostgresDatabase, PostgresError, SQLSTATE } from "fastedge::db/postgres";

async function app(event) {
  const db = PostgresDatabase.open("main");
  try {
    await db.query("insert into users (email) values ($1)", ["ann@example.com"]);
    return new Response("Created", { status: 201 });
  } catch (error) {
    if (error instanceof PostgresError && error.code === SQLSTATE.UNIQUE_VIOLATION) {
      return new Response("Already registered", { status: 409 });
    }
    throw error;
  }
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### Database KV

**Module:** `fastedge::db/kv`

```typescript
import { KvDatabase, KvError } from "fastedge::db/kv";
```

`KvDatabase` is a key-value database bound to the application by name: regional, durable, and writable from the application. It is not Edge Storage (`fastedge::kv`, read-only, replicated to every edge) or the POP-local `Cache`. The connection details stay with the host.

Every call is a round trip to the database. Calls start at once and run concurrently with each other and with `fetch`. Calls that are not awaited may run in any order: await a write before relying on it, and use `batch` for ordered or atomic work. Within one request, reads see the request's own writes. Other requests may see a write only after it has replicated (eventually, for a database with read replicas in other regions).

```typescript
class KvDatabase {
  static open(name: string): KvDatabase;
  get(key: string): Promise<KvEntry | null>;
  exists(key: string): Promise<boolean>;
  set(key: string, value: KvValue, options?: KvSetOptions): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  incr(key: string, delta?: number): Promise<number>;
  expire(key: string, options: KvExpiry): Promise<boolean>;
  batch(ops: KvOp[]): Promise<KvOpResult[]>;
}
```

- `open(name)` opens the database bound to `name`. It throws `KvError` with `kind: 'config'` if no database is bound to `name`.
- `get(key)` resolves to the value of `key`, or `null` if it does not exist or has expired.
- `exists(key)` resolves to whether `key` exists (and has not expired), without fetching its value.
- `set(key, value, options?)` sets `key`. It resolves to `false` if `ifNotExists` / `ifExists` was not met, else `true`.
- `delete(key)` deletes `key`. It resolves to `true` if it existed.
- `incr(key, delta?)` adds `delta` (default `1`, may be negative) to the integer at `key`; a missing key counts as `0`. It keeps the key's expiry and resolves to the new value. Integers beyond `Number.MAX_SAFE_INTEGER` are not exact.
- `expire(key, options)` sets the expiry of `key`. It resolves to `false` if the key does not exist.
- `batch(ops)` runs several operations atomically; see [Atomic batches](#atomic-batches).

#### Types

```typescript
type KvValue = string | ArrayBuffer | ArrayBufferView;
```

Strings are stored as UTF-8. Values must be valid UTF-8 for now: other bytes are rejected with `KvError` `kind: 'limit'`.

`KvExpiry`: pass at most one of `ttl`, `ttlMs`, or `expiresAt`, as for `Cache`.

| Field       | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `ttl`       | `number` | Relative TTL, seconds from now.      |
| `ttlMs`     | `number` | Relative TTL, milliseconds from now. |
| `expiresAt` | `number` | Absolute expiry, Unix epoch seconds. |

`KvSetOptions` extends `KvExpiry`. Without an expiry the key never expires; any earlier expiry is removed.

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `ifNotExists` | `boolean` | Write only if the key does not exist. |
| `ifExists`    | `boolean` | Write only if the key exists.         |

`KvEntry` has the same shape as `CacheEntry` from `fastedge::cache`:

| Method          | Signature                    | Description                                            |
| --------------- | ---------------------------- | ------------------------------------------------------ |
| `arrayBuffer()` | `() => Promise<ArrayBuffer>` | Value as an `ArrayBuffer`.                             |
| `text()`        | `() => Promise<string>`      | Value decoded as UTF-8.                                |
| `json()`        | `() => Promise<unknown>`     | Parsed as JSON; rejects with `SyntaxError` if invalid. |

#### Atomic batches

`batch` runs several operations atomically: all are applied or none are, and no other client sees a partial batch. Each operation sees the effects of earlier ones. An unmet `set` condition is not a failure (its result is `false`); any other failing operation rejects the whole batch with `KvError` `kind: 'operation'` and `opIndex`.

```typescript
type KvOp =
  | { op: 'get'; key: string }
  | { op: 'exists'; key: string }
  | { op: 'set'; key: string; value: KvValue; options?: KvSetOptions }
  | { op: 'delete'; key: string }
  | { op: 'incr'; key: string; delta?: number }
  | { op: 'expire'; key: string; options: KvExpiry };

type KvOpResult = KvEntry | null | number | boolean;
```

Each operation has the same semantics as the method of the same name. Results are returned in order:

| Operation                           | Result            |
| ----------------------------------- | ----------------- |
| `get`                               | `KvEntry \| null` |
| `incr`                              | `number`          |
| `exists`, `set`, `delete`, `expire` | `boolean`         |

#### KvError

`KvError` extends `Error` and has `name` `'KvError'`. It is thrown by `open` and is the rejection reason for the other methods. `code` and `opIndex` are optional.

| Property  | Type          | Description                                                             |
| --------- | ------------- | ----------------------------------------------------------------------- |
| `kind`    | `KvErrorKind` | Error category; see the table below.                                    |
| `code`    | `string`      | Backend error code (for example `'WRONGTYPE'`) for `kind: 'operation'`. |
| `opIndex` | `number`      | Index of the failing operation in a `batch`.                            |

| Kind            | Meaning                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `config`        | Unknown binding, or the binding is misconfigured (for example bad credentials).             |
| `access-denied` | Access to the database was denied.                                                          |
| `connection`    | The database could not be reached.                                                          |
| `timeout`       | The call exceeded the host's time limit; the operation may or may not have been applied.    |
| `limit`         | A host or backend limit was exceeded (value size, operations per batch, calls per request). |
| `operation`     | An operation failed, for example `incr` on a non-integer value; see `code`.                 |
| `internal`      | Internal error.                                                                             |

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvDatabase } from "fastedge::db/kv";

async function app(event) {
  const db = KvDatabase.open("main");

  const visits = await db.incr("visits");
  await db.set("last-visit", new Date().toISOString(), { ttl: 3600 });

  const last = await db.get("last-visit");
  return Response.json({ visits, lastVisit: last === null ? null : await last.text() });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

An atomic batch that counts a request in a 60-second window starting at the first request:

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

import { KvDatabase, KvError } from "fastedge::db/kv";

async function app(event) {
  const db = KvDatabase.open("main");
  const ip = event.client.address;

  try {
    const [, count] = await db.batch([
      { op: "set", key: `rl:${ip}`, value: "0", options: { ttl: 60, ifNotExists: true } },
      { op: "incr", key: `rl:${ip}` },
    ]);

    if (count > 5) {
      return new Response("Too Many Requests", { status: 429 });
    }
    return Response.json({ requests: count });
  } catch (error) {
    if (error instanceof KvError && error.kind === "operation") {
      return new Response(`Operation ${error.opIndex} failed: ${error.code}`, { status: 500 });
    }
    throw error;
  }
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

## Fetch Event

Every FastEdge application handles incoming requests by registering a listener for the `"fetch"` event.

```typescript
addEventListener(type: "fetch", listener: (this: typeof globalThis, event: FetchEvent) => any): void
```

### FetchEvent

| Property / Method | Type                                                    | Description                                              |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `request`         | `Request`                                               | The incoming HTTP request from the client.               |
| `client`          | `ClientInfo`                                            | Information about the downstream client.                 |
| `server`          | `ServerInfo`                                            | Information about the FastEdge POP handling the request. |
| `respondWith`     | `(response: Response \| PromiseLike<Response>) => void` | Sends a response back to the client.                     |
| `waitUntil`       | `(promise: Promise<any>) => void`                       | Extends the service lifetime until the promise settles.  |

`respondWith` accepts a `Response` or a `Promise<Response>`. The service is kept alive until the response has been fully sent. If the response contains a streaming body created by the service itself, the service is kept alive until that `ReadableStream` has closed or errored. If the body is a stream originating from a backend response (a backend `Response.body` passed to the `Response` constructor), the service is not kept alive until sending the body has finished.

By default, the service shuts down as soon as the response passed to `respondWith` has been sent. Use `waitUntil` to keep the service alive until additional asynchronous work completes, such as sending telemetry after the response.

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

Information about the downstream client that made the request, available as `event.client`. All fields are derived from headers the FastEdge edge POP injects into the request. Direct fields are populated when the object is first accessed; the `geo` namespace is populated only if read.

| Property    | Type      | Description                                                                                                                  |
| ----------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `address`   | `string`  | IPv4 or IPv6 address of the downstream client. Empty string if unavailable.                                                  |
| `tlsJA3MD5` | `string`  | JA3 TLS-handshake fingerprint as an MD5 hex string. Empty string for non-TLS requests or when fingerprinting is unavailable. |
| `protocol`  | `string`  | Protocol family — `"https"` or `"http"`. Not the TLS version string.                                                         |
| `geo`       | `GeoInfo` | Client geographic information. Populated lazily on first access.                                                             |

`address` is read from the platform-set `x-real-ip` header, falling back to `x-forwarded-for` if `x-real-ip` is absent. Both headers are set by the trusted edge POP and not by the client.

### GeoInfo

Geographic information about the downstream client, available as `event.client.geo`. Populated when `client.geo` is first accessed.

| Property      | Type             | Description                                                                  |
| ------------- | ---------------- | ---------------------------------------------------------------------------- |
| `asn`         | `string`         | Autonomous System Number of the client's network. Empty if unavailable.      |
| `latitude`    | `number \| null` | Latitude in decimal degrees, or `null` if unavailable.                       |
| `longitude`   | `number \| null` | Longitude in decimal degrees, or `null` if unavailable.                      |
| `region`      | `string`         | Region or state code (subdivision). Empty string if unavailable.             |
| `continent`   | `string`         | Continent code (e.g. `"EU"`, `"NA"`). Empty string if unavailable.           |
| `countryCode` | `string`         | ISO 3166-1 alpha-2 country code (e.g. `"PT"`). Empty string if unavailable. |
| `countryName` | `string`         | Country name (e.g. `"Portugal"`). Empty string if unavailable.               |
| `city`        | `string`         | City name. Empty string when geo lookup did not resolve a city.              |

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

addEventListener("fetch", event => {
  const { address, geo } = event.client;
  console.log(`Request from ${address} in ${geo.city}, ${geo.countryCode}`);
  event.respondWith(new Response("ok", { status: 200 }));
});
```

### ServerInfo

Information about the FastEdge POP server handling the request, available as `event.server`. The `pop` namespace is populated lazily on first access.

| Property  | Type      | Description                                                 |
| --------- | --------- | ----------------------------------------------------------- |
| `address` | `string`  | Server-side IP address that received the request.           |
| `name`    | `string`  | Server hostname.                                            |
| `pop`     | `PopInfo` | POP location information. Populated lazily on first access. |

### PopInfo

Geographic information about the FastEdge POP serving the request, available as `event.server.pop`.

| Property      | Type             | Description                                                       |
| ------------- | ---------------- | ----------------------------------------------------------------- |
| `latitude`    | `number \| null` | POP latitude in decimal degrees, or `null` if unavailable.        |
| `longitude`   | `number \| null` | POP longitude in decimal degrees, or `null` if unavailable.       |
| `region`      | `string`         | POP region or state code. Empty string if unavailable.            |
| `continent`   | `string`         | POP continent code. Empty string if unavailable.                  |
| `countryCode` | `string`         | ISO 3166-1 alpha-2 POP country code. Empty string if unavailable. |
| `countryName` | `string`         | POP country name. Empty string if unavailable.                    |
| `city`        | `string`         | POP city. Empty string when not resolved.                         |

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

addEventListener("fetch", event => {
  const { name, pop } = event.server;
  console.log(`Served by ${name} in ${pop.city}, ${pop.countryCode}`);
  event.respondWith(new Response("ok", { status: 200 }));
});
```

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
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const response = await fetch("https://api.example.com/data", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "value" }),
  });
  const data = await response.json();

  return Response.json(data, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

#### `Request`

```typescript
new Request(input: RequestInfo | URL, init?: RequestInit): Request
```

**Note:** `Request` can only be used when processing requests, not during build-time initialization.

| `RequestInit` field | Type                  | Description                       |
| ------------------- | --------------------- | --------------------------------- |
| `method`            | `string`              | HTTP method. Defaults to `"GET"`. |
| `headers`           | `HeadersInit`         | Request headers.                  |
| `body`              | `BodyInit \| null`    | Request body.                     |
| `signal`            | `AbortSignal \| null` | Abort signal for the request.     |

Other WHATWG `RequestInit` fields (`cache`, `credentials`, `integrity`, `keepalive`, `mode`, `redirect`, `referrer`, `referrerPolicy`, `window`) are not supported and are silently ignored if passed.

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

**Note:** `event.request.headers` is immutable, and so are the headers of `event.request.clone()`. To modify headers, copy them into `new Headers(event.request.headers)`, or build a new `Request` with a new `Headers`.

#### `Response`

```typescript
new Response(body?: BodyInit | null, init?: ResponseInit): Response
Response.redirect(url: string | URL, status?: number): Response
Response.json(data: any, init?: ResponseInit): Response
```

**Note:** `Response` can only be used when processing requests, not during build-time initialization. `Response.error()` is not implemented.

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
| `clone()`                    | `() => Response`                     | Creates a copy of the response.             |
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
| `keys()`              | `() => IterableIterator<string>`                                            |
| `values()`            | `() => IterableIterator<string>`                                            |

`forEach` also accepts an optional second argument, `thisArg?: any`.

**Immutability note:** `event.request.headers` is immutable, and so are the headers of `event.request.clone()`. To add or change headers, copy them into a new `Headers` object, or build a new `Request` with a new `Headers`:

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const newHeaders = new Headers(event.request.headers);
  newHeaders.set("x-custom", "value");

  const proxied = new Request(event.request.url, {
    method: event.request.method,
    headers: newHeaders,
    body: event.request.body,
  });

  return fetch(proxied);
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

`URL` also provides `toJSON(): string`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const url = new URL(event.request.url);
  const id  = url.searchParams.get("id");

  return new Response(`id=${id}`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

`forEach` also accepts an optional second argument, `thisArg`. `URLSearchParams` also exposes a read-only `size: number` property containing the number of search parameter entries.

---

### Streams API

The WHATWG Streams API is available for constructing and transforming streaming bodies.

#### `ReadableStream`

```typescript
new ReadableStream<R>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>
```

| `UnderlyingSource` field | Type                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `start`                  | `(controller: ReadableStreamController<R>) => any`                       |
| `pull`                   | `(controller: ReadableStreamController<R>) => void \| PromiseLike<void>` |
| `cancel`                 | `(reason?: any) => void \| PromiseLike<void>`                            |
| `type`                   | `"bytes" \| undefined`                                                   |
| `autoAllocateChunkSize`  | `number`                                                                 |

`ReadableStreamController<R>` is `ReadableStreamDefaultController<R> | ReadableByteStreamController`.

| `ReadableStream` method            | Signature                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `getReader()`                      | `() => ReadableStreamDefaultReader<R>`                                                      |
| `pipeTo(dest, options?)`           | `(dest: WritableStream<R>, options?: StreamPipeOptions) => Promise<void>`                   |
| `pipeThrough(transform, options?)` | `(transform: ReadableWritablePair<T, R>, options?: StreamPipeOptions) => ReadableStream<T>` |
| `tee()`                            | `() => [ReadableStream<R>, ReadableStream<R>]`                                              |
| `cancel(reason?)`                  | `(reason?: any) => Promise<void>`                                                           |

`ReadableStream` also exposes a read-only `locked: boolean` property.

To read a byte stream with a caller-supplied buffer, call `getReader({ mode: 'byob' })` which returns a `ReadableStreamBYOBReader`. The BYOB reader's `read(view)` method fills the provided `ArrayBufferView` in-place.

`StreamPipeOptions` accepts `{ preventAbort?: boolean, preventCancel?: boolean, preventClose?: boolean, signal?: AbortSignal }`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("hello "));
      controller.enqueue(new TextEncoder().encode("world"));
      controller.close();
    },
  });

  return new Response(stream, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

##### Readers and controllers

| Type                                 | Members                                                                |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `ReadableStreamDefaultReader<R>`     | `read()`, `releaseLock()`, `cancel(reason?)`, `closed`                 |
| `ReadableStreamBYOBReader`           | `read(view, options?)`, `releaseLock()`, `cancel(reason?)`, `closed`   |
| `ReadableStreamDefaultController<R>` | `desiredSize`, `close()`, `enqueue(chunk)`, `error(e?)`                |
| `ReadableByteStreamController`       | `byobRequest`, `desiredSize`, `close()`, `enqueue(chunk)`, `error(e?)` |
| `ReadableStreamBYOBRequest`          | `view`, `respond(bytesWritten)`, `respondWithNewView(view)`            |

`ReadableStreamDefaultReader<R>.read()` returns `Promise<ReadableStreamDefaultReadResult<R>>`. `ReadableStreamBYOBReader.read(view, options?: { min?: number })` returns `Promise<ReadableStreamDefaultReadResult<T>>`. `ReadableByteStreamController.enqueue` accepts an `ArrayBufferView`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const upstream = await fetch("https://origin.example.com/data");
  const reader   = upstream.body.getReader();
  let total      = 0;

  for (let r = await reader.read(); !r.done; r = await reader.read()) {
    total += r.value.byteLength;
  }
  reader.releaseLock();

  return new Response(`received ${total} bytes`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

#### `WritableStream`

```typescript
new WritableStream<W>(underlyingSink?: UnderlyingSink<W>, strategy?: QueuingStrategy<W>): WritableStream<W>
```

| `WritableStream` method | Signature                              |
| ----------------------- | -------------------------------------- |
| `getWriter()`           | `() => WritableStreamDefaultWriter<W>` |
| `abort(reason?)`        | `(reason?: any) => Promise<void>`      |

`WritableStream` also exposes a read-only `locked: boolean` property.

| `UnderlyingSink` field | Type                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `start`                | `(controller: WritableStreamDefaultController) => any`                                 |
| `write`                | `(chunk: W, controller: WritableStreamDefaultController) => void \| PromiseLike<void>` |
| `close`                | `() => void \| PromiseLike<void>`                                                      |
| `abort`                | `(reason?: any) => void \| PromiseLike<void>`                                          |

| `WritableStreamDefaultWriter<W>` member | Type / Signature                  |
| --------------------------------------- | --------------------------------- |
| `write(chunk)`                          | `(chunk: W) => Promise<void>`     |
| `close()`                               | `() => Promise<void>`             |
| `abort(reason?)`                        | `(reason?: any) => Promise<void>` |
| `releaseLock()`                         | `() => void`                      |
| `closed`                                | `Promise<undefined>`              |
| `ready`                                 | `Promise<undefined>`              |
| `desiredSize`                           | `number \| null`                  |

`WritableStreamDefaultController` provides `error(e?: any): void`.

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

| `Transformer` field | Type                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `start`             | `(controller: TransformStreamDefaultController<O>) => void \| PromiseLike<void>`           |
| `transform`         | `(chunk: I, controller: TransformStreamDefaultController<O>) => void \| PromiseLike<void>` |
| `flush`             | `(controller: TransformStreamDefaultController<O>) => void \| PromiseLike<void>`           |

`TransformStreamDefaultController<O>` exposes `desiredSize`, `enqueue(chunk?)`, `error(reason?)`, and `terminate()`.

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
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const encoded = new TextEncoder().encode("hello");    // Uint8Array
  const decoded = new TextDecoder().decode(encoded);    // "hello"

  return new Response(decoded, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

`TextDecoder` accepts an optional encoding label (default `"utf-8"`) and options `{ fatal?: boolean, ignoreBOM?: boolean }`. Its `decode(input?, options?: { stream?: boolean })` method decodes a `BufferSource` to a string. `TextEncoder` always encodes as UTF-8 and additionally exposes `encodeInto(source, destination)` which writes into a pre-allocated `Uint8Array` and returns `{ read, written }`.

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
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const encoded = btoa("hello world");    // "aGVsbG8gd29ybGQ="
  const decoded = atob(encoded);          // "hello world"

  return new Response(`${encoded} ${decoded}`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
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

`FilePropertyBag` extends `BlobPropertyBag` with `lastModified?: number`.

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

`forEach` also accepts an optional second argument, `thisArg?: any`.

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

Available as `crypto.subtle`. Supported methods:

| Method      | Signature                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `digest`    | `(algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>`                                                     |
| `importKey` | See overloads below                                                                                                                |
| `sign`      | `(algorithm: AlgorithmIdentifier \| EcdsaParams, key: CryptoKey, data: BufferSource) => Promise<ArrayBuffer>`                      |
| `verify`    | `(algorithm: AlgorithmIdentifier \| EcdsaParams, key: CryptoKey, signature: BufferSource, data: BufferSource) => Promise<boolean>` |

##### `crypto.subtle` — Supported Operations

| Operation                                      | Supported Algorithms                  |
| ---------------------------------------------- | ------------------------------------- |
| `digest()`                                     | SHA-1, SHA-256, SHA-384, SHA-512, MD5 |
| `sign()` / `verify()`                          | RSASSA-PKCS1-v1_5, ECDSA, HMAC        |
| `importKey()`                                  | JWK, PKCS#8, SPKI, raw (HMAC)         |
| `encrypt()` / `decrypt()`                      | **Not implemented**                   |
| `generateKey()`, `deriveKey()`, `deriveBits()` | **Not implemented**                   |
| `exportKey()`                                  | **Not implemented**                   |

`crypto.getRandomValues()` (on `crypto`, not `crypto.subtle`) is also available.

These operations support JWT verification (HMAC / ECDSA / RSASSA-PKCS1-v1_5), SAML assertion verification (SHA-256 digest + RSASSA-PKCS1-v1_5 + SPKI importKey), and general signature verification workflows. Encryption / key generation / key export are unavailable.

Raw-format key import is supported for HMAC only; ECDSA raw import raises `NotSupportedError`.

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

Import parameter dictionaries: `HmacImportParams` is `{ name, hash, length? }`, `RsaHashedImportParams` is `{ name, hash }`, and `EcKeyImportParams` is `{ name: 'ECDSA', namedCurve: 'P-256' | 'P-384' | 'P-521' }`.

`ECDSA` requires `EcdsaParams` (`{ name: 'ECDSA', hash: AlgorithmIdentifier }`) for `sign` and `verify` so that the hash function can be specified.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  // Compute SHA-256 digest
  const data    = new TextEncoder().encode("hello world");
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return new Response(hashHex, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

#### `CryptoKey`

Returned by `importKey`. Read-only properties:

| Property      | Type           | Description                          |
| ------------- | -------------- | ------------------------------------ |
| `algorithm`   | `KeyAlgorithm` | Algorithm the key was imported with. |
| `extractable` | `boolean`      | Whether the key is extractable.      |
| `type`        | `KeyType`      | One of private, public, or secret.   |
| `usages`      | `KeyUsage[]`   | Permitted operations for the key.    |

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

| Method                   | Description                              |
| ------------------------ | ---------------------------------------- |
| `console.log`            | General output.                          |
| `console.info`           | Informational output.                    |
| `console.warn`           | Warning output.                          |
| `console.error`          | Error output.                            |
| `console.debug`          | Debug output.                            |
| `console.assert`         | Logs if condition is falsy.              |
| `console.trace`          | Outputs a stack trace.                   |
| `console.time`           | Starts a named timer.                    |
| `console.timeEnd`        | Stops a named timer and logs elapsed ms. |
| `console.timeLog`        | Logs current elapsed time for a timer.   |
| `console.count`          | Logs call count for a label.             |
| `console.countReset`     | Resets call count for a label.           |
| `console.group`          | Starts an indented group.                |
| `console.groupCollapsed` | Starts a collapsed indented group.       |
| `console.groupEnd`       | Ends an indented group.                  |
| `console.dir`            | Logs object representation.              |
| `console.dirxml`         | Logs an XML/HTML-style representation.   |
| `console.table`          | Logs tabular data.                       |
| `console.clear`          | Clears the console.                      |

---

### Performance API

```typescript
performance.now(): DOMHighResTimeStamp   // number (milliseconds)
performance.timeOrigin: DOMHighResTimeStamp
```

`performance.now()` returns a high-resolution timestamp in milliseconds relative to `performance.timeOrigin`.

```javascript
/// <reference types="@gcoredev/fastedge-sdk-js" />

async function app(event) {
  const start   = performance.now();
  await fetch("https://api.example.com/data");
  const elapsed = performance.now() - start;
  console.log(`elapsed: ${elapsed}ms`);

  return new Response(`elapsed: ${elapsed}ms`, { status: 200 });
}

addEventListener("fetch", event => event.respondWith(app(event)));
```

---

### DOM Events

The standard `Event`, `EventTarget`, and `CustomEvent` interfaces are available as globals and can be used to implement custom event dispatch within an application.

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
| `location`                      | `WorkerLocation`                                            | The incoming request URL during request handling. |
| `queueMicrotask(callback)`      | `(callback: VoidFunction) => void`                          | Queues a microtask.                               |
| `structuredClone(value, opts?)` | `(value: any, options?: StructuredSerializeOptions) => any` | Deep-clones a value. Transferable: `ArrayBuffer`. |

`location` is the URL of the incoming request during request handling. During build-time initialization it is the configured init location; reading it when no init location was set throws a `TypeError`.

`WorkerLocation` exposes `href`, `origin`, `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, and `hash` as read-only string properties, and a `toString()` method.

---

## Unavailable APIs

These APIs are not implemented on the FastEdge JS runtime (StarlingMonkey, WinterCG-style). There is no Node.js compatibility layer.

- `node:crypto` — not implemented; not polyfillable (sync Node crypto cannot bridge to async `crypto.subtle`). See the runtime constraints reference for why polyfills don't work.
- `node:fs`, `node:path`, `node:buffer`, `process`, `require` — not implemented
- `WebSocket` — not implemented
- DOM APIs (`document`, `window`, etc.) — not implemented (this is a server-side runtime, not a browser)

For implementation guidance on what to use instead — particularly for crypto-heavy patterns like SAML — see the runtime constraints reference.

---

## See Also

- [BUILD_CLI.md](BUILD_CLI.md) — `fastedge-build` CLI reference
- [INIT_CLI.md](INIT_CLI.md) — `fastedge-init` CLI reference
- [STATIC_SITES.md](STATIC_SITES.md) — Serving static assets from WASM
- [ASSETS_CLI.md](ASSETS_CLI.md) — `fastedge-assets` CLI reference
- [RUNTIME_CONSTRAINTS.md](RUNTIME_CONSTRAINTS.md) — Runtime constraints and alternatives for unavailable APIs
