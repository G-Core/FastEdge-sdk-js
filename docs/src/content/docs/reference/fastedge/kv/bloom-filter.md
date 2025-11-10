---
title: Bloom Filter accessors
description: How to access Bloom Filter values from a FastEdge Kv Instance.
---

To access Bloom Filter values in a KV Store. First create a `KV Instance` using `KvStore.open()`

This instance will then provide the `bfExists` method you can use to verify if a value exists.

## zrangeByScore

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const hasItem = myStore.bfExists('key', 'value');
    return new Response(`The KV Store responded with: ${hasItem}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.bfExists(key, value);
```

##### Parameters

- `key` (required)

  A string containing the key you want to retrieve the values from.

- `value` (required)

  A string representing the value you want to check for existence.


##### Return Value

`boolean`. It returns `true` if the Bloom Filter contains the value.

