---
title: FetchEvent
description: The fetch event — request, client, server, respondWith, waitUntil.
---

Every FastEdge application is a `fetch` event listener. The runtime dispatches a `FetchEvent` for
each incoming HTTP request; your handler must call `event.respondWith()` synchronously with a
`Response` (or `Promise<Response>`).

```js
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  return new Response('hello', { status: 200 });
}
```

### FetchEvent

| Property / Method | Type                                                    | Description                                                |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| `request`         | `Request`                                               | The incoming HTTP request.                                 |
| `client`          | `ClientInfo`                                            | Information about the downstream client.                   |
| `server`          | `ServerInfo`                                            | Information about the FastEdge POP handling the request.   |
| `respondWith`     | `(response: Response \| PromiseLike<Response>) => void` | Sends a response back to the client.                       |
| `waitUntil`       | `(promise: Promise<any>) => void`                       | Extends the worker lifetime until the promise settles.     |

### waitUntil — running work after the response is sent

`event.respondWith` keeps the worker alive until the response is fully sent. `event.waitUntil`
extends that lifetime further: the worker continues running until every promise registered with
`waitUntil` has settled. This lets you do logging, telemetry, or cache warming **after** the
client has already received its response — without making the user wait for it.

```js
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  // Fire-and-forget logging — runs after respondWith returns to the client.
  event.waitUntil(
    fetch('https://logging.example.com/log', {
      method: 'POST',
      body: JSON.stringify({ url: event.request.url, ip: event.client.address }),
      headers: { 'content-type': 'application/json' },
    }),
  );

  return new Response('ok', { status: 200 });
}
```

If a promise registered with `waitUntil` rejects, the worker still terminates cleanly — the
rejection is logged but does not affect the response that was already sent.

### ClientInfo

Available as `event.client`. Fields are derived from headers the FastEdge POP injects into the
request — the application does not need to parse `x-forwarded-for` or `x-real-ip` itself. The
`geo` namespace is populated lazily on first access.

| Property    | Type      | Description                                                                  |
| ----------- | --------- | ---------------------------------------------------------------------------- |
| `address`   | `string`  | IPv4 or IPv6 address of the downstream client. Empty string if unavailable.  |
| `tlsJA3MD5` | `string`  | JA3 TLS-handshake fingerprint as MD5 hex. Empty for non-TLS or unavailable.  |
| `protocol`  | `string`  | Protocol family — `"https"` or `"http"`. Not the TLS version string.         |
| `geo`       | `GeoInfo` | Client geographic information. Populated lazily on first access.             |

### GeoInfo

Available as `event.client.geo`.

| Property      | Type             | Description                                                       |
| ------------- | ---------------- | ----------------------------------------------------------------- |
| `asn`         | `string`         | Autonomous System Number of the client's network.                 |
| `latitude`    | `number \| null` | Latitude in decimal degrees, or `null` if unavailable.            |
| `longitude`   | `number \| null` | Longitude in decimal degrees, or `null` if unavailable.           |
| `region`      | `string`         | Region or state code (subdivision).                               |
| `continent`   | `string`         | Continent code (e.g. `"EU"`, `"NA"`).                             |
| `countryCode` | `string`         | ISO 3166-1 alpha-2 country code (e.g. `"PT"`).                    |
| `countryName` | `string`         | Country name (e.g. `"Portugal"`).                                 |
| `city`        | `string`         | City name. Empty when geo lookup did not resolve a city.          |

```js
addEventListener('fetch', (event) => {
  const { address, geo } = event.client;
  console.log(`Request from ${address} in ${geo.city}, ${geo.countryCode}`);
  event.respondWith(new Response('ok', { status: 200 }));
});
```

### ServerInfo

Available as `event.server`. The `pop` namespace is populated lazily on first access.

| Property  | Type      | Description                                                  |
| --------- | --------- | ------------------------------------------------------------ |
| `address` | `string`  | Server-side IP address that received the request.            |
| `name`    | `string`  | Server hostname.                                             |
| `pop`     | `PopInfo` | POP location information. Populated lazily on first access.  |

### PopInfo

Available as `event.server.pop`. Useful for routing decisions, geographically-aware caching keys,
or telling clients which POP served them.

| Property      | Type             | Description                                                 |
| ------------- | ---------------- | ----------------------------------------------------------- |
| `latitude`    | `number \| null` | POP latitude in decimal degrees, or `null` if unavailable.  |
| `longitude`   | `number \| null` | POP longitude in decimal degrees, or `null` if unavailable. |
| `region`      | `string`         | POP region or state code.                                   |
| `continent`   | `string`         | POP continent code.                                         |
| `countryCode` | `string`         | ISO 3166-1 alpha-2 POP country code.                        |
| `countryName` | `string`         | POP country name.                                           |
| `city`        | `string`         | POP city.                                                   |

```js
addEventListener('fetch', (event) => {
  const { name, pop } = event.server;
  console.log(`Served by ${name} in ${pop.city}, ${pop.countryCode}`);
  event.respondWith(new Response('ok', { status: 200 }));
});
```
