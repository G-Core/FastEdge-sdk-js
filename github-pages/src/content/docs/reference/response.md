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

### Properties and methods

| Property / Method | Type                                 | Description                                  |
| ----------------- | ------------------------------------ | -------------------------------------------- |
| `status`          | `number`                             | HTTP status code.                            |
| `statusText`      | `string`                             | HTTP status text.                            |
| `ok`              | `boolean`                            | `true` if `status` is in the range 200–299.  |
| `redirected`      | `boolean`                            | `true` if the response was redirected.       |
| `url`             | `string`                             | URL of the response.                         |
| `headers`         | `Headers`                            | Response headers.                            |
| `body`            | `ReadableStream<Uint8Array> \| null` | Response body stream.                        |
| `bodyUsed`        | `boolean`                            | Whether the body has already been consumed.  |
| `text()`          | `() => Promise<string>`              | Reads body as a string.                      |
| `json()`          | `() => Promise<any>`                 | Reads body and parses as JSON.               |
| `arrayBuffer()`   | `() => Promise<ArrayBuffer>`         | Reads body as an `ArrayBuffer`.              |
| `blob()`          | `() => Promise<Blob>`                | Reads body as a `Blob`.                      |
| `formData()`      | `() => Promise<FormData>`            | Reads body as `FormData`.                    |

### Static helpers

```js
Response.json(data, init?);
Response.redirect(url, status?);
```

- `Response.json(data, init?)` — serialises `data` to JSON and returns a `Response` with
  `content-type: application/json`. `init` accepts the same options as the constructor.
- `Response.redirect(url, status?)` — returns a redirect response. `status` defaults to `302` and
  must be one of the valid redirect codes (301, 302, 303, 307, 308).

```js
return Response.json({ ok: true }, { status: 201 });
return Response.redirect('https://example.com', 301);
```

:::note[INFO]

Like `Request`, the `Response` returned from a downstream `fetch()` has an **immutable** `headers`
object. To modify response headers before returning to the client, construct a new `Response`:

```js
const upstream = await fetch('https://origin.example.com');
const headers = new Headers(upstream.headers);
headers.set('x-cache', 'miss');

return new Response(upstream.body, {
  status: upstream.status,
  statusText: upstream.statusText,
  headers,
});
```

:::
