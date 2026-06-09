---
title: Cache purge
description: purge and purgePrefix operations on the FastEdge cache.
---

Bulk-delete operations that remove multiple cache entries in a single call. Both methods return the
number of keys deleted. Cache entries are shared across all applications for a given account, so
these operations affect all keys available to the account.

## purge

Deletes all cache entries available to an application.

The host scans the key index, deletes every cached key, and removes the index itself.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  const deleted = await Cache.purge();
  return Response.json({ purged: deleted });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.purge();
```

##### Parameters

None.

##### Return Value

A `Promise<number>` — the number of keys deleted.

## purgePrefix

Deletes all cache entries whose keys begin with `prefix`.

The host scans the key index for keys that start with the given prefix, deletes every matched key,
and removes those entries from the index. The index itself is kept for any remaining (unmatched)
keys.

```js
import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  // Invalidate all cached user profiles after a bulk update
  const deleted = await Cache.purgePrefix('user:');
  return Response.json({ purged: deleted });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
Cache.purgePrefix(prefix);
```

##### Parameters

- `prefix` (required)

  A string. All keys in the application's cache that start with this value are deleted.

##### Return Value

A `Promise<number>` — the number of keys deleted.
