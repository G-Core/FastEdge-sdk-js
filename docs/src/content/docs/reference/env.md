---
title: FastEdge::env
description: How to use FastEdge environment variables.
---

### Environment Variables

To access environment variables, set during deployment on the FastEdge network.

```js
import { getEnv } from 'fastedge::env';

async function eventHandler(event) {
  const customEnvVariable = getEnv('MY_CUSTOM_ENV_VAR');
  return new Response({ customEnvVariable });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
getEnv(keyName);
```

##### Parameters

- `keyName` (required)

  A string containing the name of the key you want to retrieve the value of.

##### Return Value

A string containing the value of the key. If the key does not exist, null is returned.
