---
title: Sorted Set accessors
description: How to access Sorted Set values from a FastEdge Kv Instance.
---

To access Sorted Set values in a KV Store. First create a `KV Instance` using `KvStore.open()`

This instance provides `zrangeByScore` / `zrangeByScoreEntries` to
retrieve values within a score range, and `zscan` / `zscanEntries` to
match values by prefix. The `*Entries` variants return `KvStoreEntry`
wrappers with `text()` / `json()` / `arrayBuffer()` decode helpers; the
non-entry variants return raw `ArrayBuffer` values.

## zrangeByScore

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const results = myStore.zrangeByScore('key', 0, 10);
    return new Response(`The KV Store responded with: ${JSON.stringify(results)}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.zrangeByScore(key, min, max);
```

##### Parameters

- `key` (required)

  A string containing the key you want to retrieve the values from.

- `min` (required)

  A number representing the min-score for which to return values for.

- `max` (required)

  A number representing the max-score for which to return values for.

##### Return Value

An `Array<[ArrayBuffer, number]>`. It returns a list of tuples, containing the value in an
ArrayBuffer and the score as a number.

## zrangeByScoreEntries

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const results = await myStore.zrangeByScoreEntries('key', 0, 10);
    const decoded = await Promise.all(
      results.map(async ([entry, score]) => [await entry.text(), score]),
    );
    return new Response(`The KV Store responded with: ${JSON.stringify(decoded)}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.zrangeByScoreEntries(key, min, max);
```

##### Parameters

Same as `zrangeByScore`.

##### Return Value

A `Promise<Array<[KvStoreEntry, number]>>`. Each tuple contains a
`KvStoreEntry` (with `text()` / `json()` / `arrayBuffer()` accessors)
and the score as a number. Resolves to an empty array if no values
match.

## zscan

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const results = myStore.zscan('pre*');
    return new Response(`The KV Store responded with: ${JSON.stringify(results)}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.zscan(key, pattern);
```

##### Parameters

- `key` (required)

  A string containing the key you want to retrieve the values from.

- `pattern` (required)

  A string containing the prefix pattern match.

**Note**: This is a prefix match, it must contain the wildcard `*`. In the given example it matches
all values that start with `pre`

##### Return Value

An `Array<[ArrayBuffer, number]>`. It returns a list of tuples, containing the value in an
ArrayBuffer and the score as a number.

## zscanEntries

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const results = await myStore.zscanEntries('key', 'pre*');
    const decoded = await Promise.all(
      results.map(async ([entry, score]) => [await entry.text(), score]),
    );
    return new Response(`The KV Store responded with: ${JSON.stringify(decoded)}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.zscanEntries(key, pattern);
```

##### Parameters

Same as `zscan`.

##### Return Value

A `Promise<Array<[KvStoreEntry, number]>>`. Each tuple contains a
`KvStoreEntry` (with `text()` / `json()` / `arrayBuffer()` accessors)
and the score as a number. Resolves to an empty array if no values
match.
