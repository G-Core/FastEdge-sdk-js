---
title: Sorted Set accessors
description: How to access Sorted Set values from a FastEdge Kv Instance.
---

To access Sorted Set values in a KV Store. First create a `KV Instance` using `KvStore.open()`

This instance will then provide the `zrangeByScore` and `zscan` methods you can use to access Sorted
Set values.

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
