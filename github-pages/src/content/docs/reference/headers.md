---
title: Headers
description: Response / Request Headers.
---

TThe Headers() constructor creates a new Headers object.

```js
new Headers();
new Headers(init);
```

##### Parameters

- `init` (optional)

  An object containing any HTTP headers you want to prepopulate your `Headers` object with. This can
  be a simple object literal with String values, an array of name-value pairs, where each pair is a
  2-element string array; or an existing Headers object. In the last case, the new Headers object
  copies its data from the existing Headers object.

:::note[INFO]

Request and Response Headers are immutable. This means, if you need to modify Request headers for
downstream fetch requests, or modify Response headers prior to returning a Response. You will need
to create a `new Headers()` object.

:::
