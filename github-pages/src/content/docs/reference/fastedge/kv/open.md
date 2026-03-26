---
title: KV Stores
description: How to use FastEdge Key-Value Stores.
---

### KV Store Open

How to access Key-value Stores within FastEdge.

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
KvStore.open(kvStoreName);
```

##### Parameters

- `kvStoreName` (required)

  A string containing the name of the store you want to open.

##### Return Value

A `KV Instance` that lets you interact with the store. It provides:

- get
- scan
- zrangeByScore
- zscan
- bfExists
