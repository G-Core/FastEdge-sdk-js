---
title: Key-value accessors
description: How to access Key-value pairs from a FastEdge Kv Instance.
---

To access key-value pairs in a KV Store. First create a `KV Instance` using `KvStore.open()`

This instance will then provide the `get` and `scan` methods you can use to access key-value pairs.

## get

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const value = myStore.get('key');
    return new Response(`The KV Store responded with: ${value}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.get(key);
```

##### Parameters

- `key` (required)

  A string containing the key you want to retrieve the value of.

##### Return Value

An `ArrayBuffer` of the value for the given key. If the key does not exist, null is returned.

## scan

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const results = myStore.scan('pre*');
    return new Response(`The KV Store responded with: ${results.join(', ')}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
storeInstance.scan(pattern);
```

##### Parameters

- `pattern` (required)

  A string containing the prefix pattern match.

**Note**: This is a prefix match, it must contain the wildcard `*`. In the given example it matches
all keys that start with `pre`

##### Return Value

An `Array<string>` of all the keys that match the given pattern. If no `matches` are found it
returns an empty array.
