# API Basics

The Javascript SDK is still in beta 🚧 and under construction.

At this point it is possible to build javascript code into a wasm and deploy it to the FastEdge
network.

The Javascript code you write will look and feel very much like the
[Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

We will continue to add examples into the [examples folder](./examples) including this
[basic example](./examples/basic.js)

The key thing to note is that the addEventListener callback has to synchronously call
event.respondWith() with a callback.

This callback is allowed to be asynchronous, and is usually where you would carry out any custom
code, it **has** to return a `Response`.

We are working to bring more features, but please enjoy this beta release and have a play.

---

### Response

The Response() constructor creates a new Response object.

```js
new Response();
new Response(body);
new Response(body, options);
```

##### Parameters

- `body` (optional)

  - A string defining the body of a response. This can be `null` that is the default.

- `options` (optional)

  An options object containing any other data to associate with the Response

  - status: number - the status code you wish to return. e.g. `200`
  - headers: object - containing either a `Headers` object or plain object with key/value pairs.

---

### Environment Variables

To access environment variables, set during deployment on the FastEdge network.

```js
import { getEnv } from 'fastedge::getenv';

async function eventHandler(event) {
  const customEnvVariable = getEnv('MY_CUSTOM_ENV_VAR');
}
```

##### Parameters

- `key` string (required) - the environment variable you wish to access.

##### Return Value

A string representing the value of the environment variable.

---
