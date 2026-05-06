---
title: Cache read & write
description: get, set, delete, and exists operations on the FastEdge cache.
---

The four basic read/write operations on the cache. All are static, all return Promises.

## get

Returns the entry for `key`, or `null` if the key is absent or expired.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const entry = await Cache.get('user:42');
  if (entry === null) {
    return new Response('Not found', { status: 404 });
  }
  const user = await entry.json();
  return Response.json(user);
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.get(key);
```

##### Parameters

- `key` (required)

  A string identifying the entry to retrieve.

##### Return Value

A `Promise<CacheEntry | null>`. The bytes are already in memory by the time the Promise resolves;
the `CacheEntry` accessor methods (`text`, `json`, `arrayBuffer`) resolve immediately. See
[CacheEntry accessors](#cacheentry-accessors) below.

## set

Stores a value under `key`, overwriting any existing entry. Optionally sets an expiry.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  await Cache.set('session:abc', JSON.stringify({ user: 42 }), { ttl: 600 });
  await Cache.set('manifest', await fetch('/manifest.json'));
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.set(key, value, options?);
```

##### Parameters

- `key` (required)

  A string identifying the entry to write.

- `value` (required)

  A `CacheValue` — `string`, `ArrayBuffer`, `ArrayBufferView`, `ReadableStream`, or `Response`. All
  forms are coerced to raw bytes before storage.

- `options` (optional)

  A `WriteOptions` object: `{ ttl }`, `{ ttlMs }`, or `{ expiresAt }`. Omit (or pass `{}`) for no
  expiry.

##### Return Value

A `Promise<void>`.

## delete

Removes the entry at `key`. A no-op if the key is already absent — no error is thrown.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  await Cache.delete('session:abc');
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.delete(key);
```

##### Parameters

- `key` (required)

  A string identifying the entry to remove.

##### Return Value

A `Promise<void>`.

## exists

Tests whether a key is present without transferring its value. Cheaper than `get` when only
presence matters (e.g. idempotency-key checks, "have we seen this token before?").

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  if (await Cache.exists('idempotency:abc')) {
    return new Response('Already processed', { status: 200 });
  }
  // ... do the work, then mark it as seen
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.exists(key);
```

##### Parameters

- `key` (required)

  A string identifying the entry to test.

##### Return Value

A `Promise<boolean>` — `true` if the key is present and unexpired, `false` otherwise.

## CacheEntry accessors

`Cache.get` and `Cache.getOrSet` resolve to `CacheEntry` objects. The bytes are already in memory;
the accessor methods are Promise-returning to align with the standard Web `Body` interface, but
they resolve immediately.

| Method        | Signature                  | Description                                    |
| ------------- | -------------------------- | ---------------------------------------------- |
| `text`        | `(): Promise<string>`      | Read the entry as a UTF-8 decoded string       |
| `json`        | `(): Promise<unknown>`     | Read the entry as parsed JSON                  |
| `arrayBuffer` | `(): Promise<ArrayBuffer>` | Read the entry as raw bytes                    |

`json` rejects with a `SyntaxError` if the bytes are not valid JSON.
