---
title: FastEdge Javascript SDK
description: A basic description of the overall javascript SDK.
---

### Basic Usage

The Javascript code you write will look and feel very much like the
<a href='https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API' target='_blank' rel='noopener noreferrer'>
Service Workers API </a> .

All incoming HTTP requests will start an instance of your FastEdge application and invoke a fetch
event, which can be bound using the addEventListener function:

```js
async function eventHandler(event) {
  const request = event.request;
  return new Response(`You made a request to ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

The key thing to note is that the addEventListener callback has to synchronously call
event.respondWith() with another callback function.

This callback is allowed to be asynchronous, and is usually where you would carry out any custom
code, it also **has** to return a `Response` object.

:::caution[NOTE]

The `addEventListener()` callback **must** synchronously call `event.respondWith()`

:::
