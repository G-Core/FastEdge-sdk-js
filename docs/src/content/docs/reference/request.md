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
