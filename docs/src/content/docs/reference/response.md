---
title: Response
description: Response object definition.
---

The Response() constructor creates a new Response object.

```js
new Response();
new Response(body);
new Response(body, options);
```

##### Parameters

- `body` (optional)

  A object defining the body of a response. This can be `null` (which is the default) or one of the
  following:

  - ArrayBuffer
  - TypedArray
  - DataView
  - ReadableStream
  - URLSearchParams
  - String
  - string literal

- `options` (optional)

  An options object containing any other data to associate with the Response

  - status: (optional)

    A number representing the http status code. e.g. `200`

  - statusText: (optional)

    The status message associated with the status code, e.g. `OK`.

  - headers: (optional)

    An object: containing either a `Headers` object or object literal with `String` key/value pairs.
