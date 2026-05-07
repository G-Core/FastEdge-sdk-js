---
title: Cache.getOrSet
description: Lazy populate-on-miss helper for the FastEdge cache.
---

`Cache.getOrSet` returns the entry for `key`, or runs `populate` and stores its result on a cache
miss. It coalesces concurrent in-process callers and supports a `null` return from `populate` as a
"skip the write" signal.

## Basic usage

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const entry = await Cache.getOrSet(
    'expensive-result',
    async () => JSON.stringify(await compute()),
    { ttl: 300 },
  );
  return new Response(await entry.text(), {
    headers: { 'content-type': 'application/json' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.getOrSet(key, populate, options?);
```

##### Parameters

- `key` (required)

  A string identifying the entry.

- `populate` (required)

  A function called only on a cache miss. May be synchronous or `async`. Its return value is stored
  under `key` and returned to the caller via a `CacheEntry`.

- `options` (optional)

  A `WriteOptions` object controlling the TTL written on a miss. Has no effect on a hit.

##### Return Value

A `Promise<CacheEntry>` — see the [Cache read & write](/FastEdge-sdk-js/reference/fastedge/cache/read-write/#cacheentry-accessors)
page for the accessor methods.

## Coalescing scope

Concurrent callers for the same key **within the same WASM instance** share a single `populate`
execution — the callback is not duplicated for joiners. This makes `getOrSet` a reliable way to
deduplicate expensive work (origin fetches, derived computations) under burst traffic.

Concurrent requests handled by **other WASM instances** — including other workers in the same POP —
race independently and may each run `populate`. This is the honest guarantee of a POP-local cache.

## Errors

If `populate` throws or its Promise rejects, the rejection propagates to all current waiters. The
next call after the rejection retries `populate` — there is no negative caching.

## Skip-cache signal

The second overload accepts a `populate` that may return `null`. When it does, the value is **not**
written to the cache and `getOrSet` resolves with `null`. Use this to wrap fallible work and only
pin successes — for example, caching only `response.ok` upstream fetches so a transient 5xx
doesn't get held for the rest of the TTL window.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const url = new URL(event.request.url);
  const entry = await Cache.getOrSet(
    `proxy:${url.pathname}`,
    async () => {
      const r = await fetch(`https://origin.example.com${url.pathname}`);
      return r.ok ? r : null; // Skip the write on non-2xx
    },
    { ttl: 30 },
  );

  if (entry === null) {
    return Response.json({ error: 'upstream unavailable' }, { status: 503 });
  }
  return new Response(await entry.arrayBuffer());
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

If you also need to surface the original error response to the caller (e.g. return the upstream
404 as-is), use a manual `Cache.get` + conditional `Cache.set` instead — the populator can't carry
both "fetched but don't cache" and "here is the response to return".

## Overload summary

| Populator return type                                      | `getOrSet` resolves to        |
| ---------------------------------------------------------- | ----------------------------- |
| `CacheValue \| Promise<CacheValue>`                         | `Promise<CacheEntry>`         |
| `CacheValue \| null \| Promise<CacheValue \| null>`         | `Promise<CacheEntry \| null>` |
