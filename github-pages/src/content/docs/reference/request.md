---
title: Request
description: Request object definition.
---

The Request() constructor creates a new Request object.

```js
new Request(input);
new Request(input, options);
```

##### Parameters

- `input`

  Defines the resource you wish to fetch. Can be one of the following:

  - A string containing the resource you wish to fetch.
  - `Request` object, effectively creating a copy.

- `options` (optional)

  An options object containing any other data to associate with the Request

  - method: (optional)

    e.g. `GET`, `POST`, `PUT`, `DELETE`. (Default is `GET`)

  - headers: (optional)

    An object: containing either a `Headers` object or object literal with `String` key/value pairs.

  - body: (optional)

    Any body that you want to add to your request: this can be an `ArrayBuffer`, a `TypedArray`, a
    `DataView`, a `URLSearchParams`, string object or literal, or a `ReadableStream` object.

:::note[INFO]

The `Request` you receive from `event.request` is **immutable**, including its `headers`. Calls to
`headers.set`, `headers.append`, or `headers.delete` on the incoming request will throw a
`TypeError`. To modify headers before forwarding, construct a new `Request` from the original:

```js
const newHeaders = new Headers(event.request.headers);
newHeaders.set('x-custom', 'value');

const proxied = new Request(event.request.url, {
  method: event.request.method,
  headers: newHeaders,
  body: event.request.body,
});
```

:::
