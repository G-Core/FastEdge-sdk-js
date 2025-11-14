---
title: getSecret
description: How to use FastEdge secret variables.
---

### Secret Variables

To access secret variables, set during deployment on the FastEdge network.

```js
import { getSecret } from 'fastedge::secret';

async function eventHandler(event) {
  const secretToken = getSecret('MY_SECRET_TOKEN');
  return new Response({ secretToken });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
getSecret(secretName);
```

##### Parameters

- `secretName` (required)

  A string containing the name of the key you want to retrieve the value of.

##### Return Value

A string containing the value of the key. If the key does not exist, null is returned.

**Note**: If the secret contains multiple `secret_slots` you will always receive the MAX `slot`
value.
