<!-- maintenance: hand-authored. Not produced by fastedge-plugin-source/generate-docs.sh. Edit this file directly. -->

# Hono Patterns on FastEdge

[Hono](https://hono.dev) is the recommended HTTP framework for FastEdge JS apps. It is small, edge-native, and integrates cleanly with the FastEdge `addEventListener('fetch', ...)` Service Worker pattern.

## FastEdge Integration

A Hono app is wired into FastEdge by passing the `FetchEvent.request` to `app.fetch()`:

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello FastEdge!"));

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.fetch(event.request));
});
```

Use `app.fetch(event.request)` — not `app.fire()`. `app.fire()` is deprecated in Hono and registers a global `fetch` listener of its own, which conflicts with the FastEdge `addEventListener('fetch', ...)` Service Worker integration.

## Routing

### Basic Routes

```typescript
app.get("/", (c) => c.text("Home"));
app.get("/health", (c) => c.json({ status: "ok" }));
app.post("/data", async (c) => {
  const body = await c.req.json();
  return c.json({ received: body });
});
```

### Path Parameters

```typescript
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ userId: id });
});
```

### Wildcards

```typescript
app.get("/api/*", (c) => c.text("API route"));
```

### Sub-routers via `app.route()`

Mount a child Hono instance under a path prefix. This is the pattern used by the `react-with-hono-server` example to separate API routes from static asset serving:

```typescript
import { Hono } from "hono";
import { api } from "./api/routes.js";

const app = new Hono();

app.route("/api", api);          // mount API sub-router

app.get("*", async (c) => {       // catch-all for static assets
  return staticServer.serveRequest(c.req.raw);
});
```

Order matters: `app.route("/api", ...)` must be registered before any catch-all `app.get("*", ...)`, otherwise the wildcard absorbs API requests.

## Middleware

### Built-in Middleware

Apply CORS, logging, and secure headers globally:

```typescript
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

app.use("/*", cors());
app.use("/*", logger());
app.use("/*", secureHeaders());
```

### Path-scoped Middleware

Apply middleware only to specific path patterns:

```typescript
app.use("/api/*", async (c, next) => {
  const token = c.req.header("Authorization");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  await next();
});
```

### Custom Middleware

Custom middleware is an `async (c, next) => { ... }` function. Call `await next()` to continue the chain, or return a response to short-circuit:

```typescript
const requestId = async (c, next) => {
  const id = crypto.randomUUID();
  c.header("X-Request-Id", id);
  await next();
};

app.use("/*", requestId);
```

For an authentication middleware example using `getSecret`, see the auth patterns reference.

## Error Handling

```typescript
app.onError((err, c) => {
  console.error("Unhandled error:", err.message);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});
```

Always register `onError` — without it, an unhandled exception in a route handler surfaces as a FastEdge 531 (runtime error) with no useful response body for the client.

## JSON API Pattern

```typescript
const app = new Hono();

app.use("/*", cors());

app.get("/api/items", async (c) => {
  const items = await fetchItemsFromBackend();
  return c.json(items);
});

app.post("/api/items", async (c) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const result = await createItem(body);
  return c.json(result, 201);
});

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.fetch(event.request));
});
```

## Imports — Tree-shaking

Import middleware from its specific path, not the umbrella `hono/middleware`:

```typescript
// Good — only the cors middleware is bundled
import { cors } from "hono/cors";

// Bad — pulls everything in
import { cors, logger, basicAuth } from "hono/middleware";
```

`fastedge-build` performs tree-shaking, but path-specific imports make the intent explicit and keep binary size predictable.

## See Also

- `examples/react-with-hono-server/` — full SPA + Hono API example with sub-routers and static asset serving
- Auth patterns reference — bearer-token and JWT validation patterns that can be applied as Hono middleware
- Proxy patterns reference — outbound `fetch` and response transform patterns that work inside Hono route handlers
