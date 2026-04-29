<!-- maintenance: hand-authored. Not produced by fastedge-plugin-source/generate-docs.sh. Edit this file directly. -->

# Proxy and Response Transform Patterns

FastEdge HTTP apps can act as a thin proxy in front of an origin or upstream API — fetching a response, transforming it, and returning the result. This document covers the common proxy and transform patterns.

## Simple Proxy

Fetch from an upstream and return the body unchanged:

```typescript
async function handle(request) {
  const url = new URL(request.url);
  const upstream = `https://backend.example.com${url.pathname}${url.search}`;

  const response = await fetch(upstream, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined,
  });

  return response;
}

addEventListener("fetch", (event) => {
  event.respondWith(handle(event.request));
});
```

`fetch()` returns a streamable `Response`; returning it directly forwards body chunks without buffering everything in memory.

## Proxy with JSON Transform

Modify the response body before returning it. This is the pattern from `examples/outbound-modify-response/`:

```typescript
async function handle() {
  const upstream = await fetch("http://jsonplaceholder.typicode.com/users");
  const users = await upstream.json();

  const transformed = {
    users: users.slice(0, 5),
    total: 5,
    skip: 0,
    limit: 30,
  };

  return new Response(JSON.stringify(transformed), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handle());
});
```

Reading `await upstream.json()` consumes the body; you cannot read it again. Read the body once, transform what you need, then return.

## Hono Proxy with Transform

Inside a Hono app, use `c.req.raw.headers` to forward the inbound headers and `c.req.arrayBuffer()` for the body:

```typescript
import { Hono } from "hono";

const app = new Hono();

app.all("/api/*", async (c) => {
  const url = new URL(c.req.url);
  const upstream = `https://backend.example.com${url.pathname}${url.search}`;

  const response = await fetch(upstream, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method !== "GET" && c.req.method !== "HEAD"
      ? await c.req.arrayBuffer()
      : undefined,
  });

  const data = await response.json();
  data.processedAt = new Date().toISOString();
  return c.json(data, response.status);
});

addEventListener("fetch", (event) => {
  event.respondWith(app.fetch(event.request));
});
```

## Header Manipulation in Proxies

Strip hop-by-hop headers before forwarding to upstream, and add diagnostic headers on the way back:

```typescript
async function handle(request) {
  const upstreamHeaders = new Headers(request.headers);
  // Hop-by-hop headers should not be forwarded
  upstreamHeaders.delete("connection");
  upstreamHeaders.delete("keep-alive");
  upstreamHeaders.delete("transfer-encoding");

  const upstream = await fetch("https://backend.example.com", {
    method: request.method,
    headers: upstreamHeaders,
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("X-Proxied-By", "FastEdge");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
```

`new Response(upstream.body, ...)` streams the body through without reading it into memory — preferred for large responses.

## Cache-aware Proxy with KV

Cache upstream responses in the KV store to avoid repeated outbound calls. Note: KV is read-only from app code; writes happen via the portal/API:

```typescript
import { KvStore } from "fastedge::kv";

async function handle(request) {
  const url = new URL(request.url);

  try {
    const cache = KvStore.open("api-cache");
    const cached = cache.get(url.pathname);
    if (cached !== null) {
      return new Response(cached, {
        status: 200,
        headers: { "content-type": "application/json", "x-cache": "hit" },
      });
    }
  } catch {
    // KV store unavailable — fall through to upstream fetch
  }

  const upstream = await fetch(`https://backend.example.com${url.pathname}`);
  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: { ...Object.fromEntries(upstream.headers), "x-cache": "miss" },
  });
}
```

`KvStore.open(name)` returns a `KvStoreInstance` (it does not return null) but can throw if the named store is not provisioned — wrap the open call in `try/catch`. `cache.get(key)` returns `ArrayBuffer | null`; check for `null`, not falsy, since an empty buffer is a valid value.

## Operational Notes

- **Outbound fetch budget.** Each invocation has a limited number of outbound requests (5 on Basic, 20 on Pro). Parallelise where possible with `Promise.all([...])` instead of sequential `await fetch(...)`.
- **Execution time budget.** Proxying upstream + transforming counts against the 50ms (Basic) / 200ms (Pro) execution budget. Slow upstreams will trip 532 timeouts.
- **Body size limits.** Inbound and outbound bodies are subject to the configured request/response size limits. Stream where possible rather than buffering with `arrayBuffer()` / `text()` / `json()`.

## See Also

- `examples/outbound-modify-response/` — JSON transform of upstream response
- `examples/outbound-fetch/` — basic outbound `fetch()` patterns
- `examples/headers/` — request/response header manipulation
- `examples/kv-store/` — KV-backed caching patterns
