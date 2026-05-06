---
title: Cache atomic & TTL
description: incr, decr, and expire — atomic counters and TTL updates on the FastEdge cache.
---

Atomic counter and expiry primitives. Because the cache is strongly consistent within a POP, these
operations are safe under concurrent load — two simultaneous `incr` calls cannot both observe the
same pre-increment value.

## incr

Atomically increments the integer at `key` by `delta` (default `1`). If the key does not exist, it
is initialised to `0` before incrementing. Resolves to the new value.

`delta` may be negative; for readability prefer `Cache.decr` in that case.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const ip = event.client.address ?? 'unknown';
  const key = `rl:${ip}`;

  const count = await Cache.incr(key);

  // First hit of a new window — anchor the 60s expiry to it. If we set
  // the expiry on every request, the window would never close.
  if (count === 1) {
    await Cache.expire(key, { ttl: 60 });
  }

  if (count > 100) {
    return new Response('Too Many Requests', { status: 429 });
  }
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.incr(key, delta?);
```

##### Parameters

- `key` (required)

  A string identifying the counter to increment.

- `delta` (optional)

  A number to add. Defaults to `1`. May be negative.

##### Return Value

A `Promise<number>` resolving to the new value. Rejects if the value at `key` is not an integer.

**Note**: integer values larger than `Number.MAX_SAFE_INTEGER` (2^53 − 1) are not represented
exactly. This is unreachable for typical counter use cases.

## decr

Sugar for `Cache.incr(key, -(delta ?? 1))`. Atomically decrements the integer at `key` by `delta`
(default `1`). Resolves to the new value.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const remaining = await Cache.decr('quota:user-42');
  if (remaining < 0) {
    return new Response('Quota exhausted', { status: 429 });
  }
  return new Response('ok');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.decr(key, delta?);
```

##### Parameters

- `key` (required)

  A string identifying the counter to decrement.

- `delta` (optional)

  A number to subtract. Defaults to `1`.

##### Return Value

A `Promise<number>` resolving to the new value.

## expire

Updates the expiry of an existing key. Resolves to `true` if the expiry was set, `false` if the key
does not exist. Use this with `Cache.incr` to anchor a fixed-window TTL to the first hit.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const ok = await Cache.expire('rl:1.2.3.4', { ttl: 60 });
  return Response.json({ updated: ok });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.expire(key, options);
```

##### Parameters

- `key` (required)

  A string identifying the entry whose expiry should be updated.

- `options` (required)

  A `WriteOptions` object: `{ ttl }`, `{ ttlMs }`, or `{ expiresAt }`. Pass exactly one — passing
  more than one, or a zero/negative value, throws `TypeError`.

##### Return Value

A `Promise<boolean>` — `true` if the expiry was applied, `false` if the key did not exist.
