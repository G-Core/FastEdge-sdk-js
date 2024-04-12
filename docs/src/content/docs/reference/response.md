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

  A string defining the body of a response. This can be `null` that is the default.

- `options` (optional)

  An options object containing any other data to associate with the Response

  - status: (optional)

    A number representing the http status code. e.g. `200`

  - headers: (optional)

    An object: containing either a `Headers` object or object literal with `String` key/value pairs.
