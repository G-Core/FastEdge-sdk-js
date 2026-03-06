import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";

import server from "./server.js";

const router = new Hono();

router.all("/mcp", async (c) => {
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(router.fetch(event.request));
});
