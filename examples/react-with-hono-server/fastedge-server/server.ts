import { createStaticServer } from "@gcoredev/fastedge-sdk-js";
import { Hono } from "hono";

import { serverConfig } from "./config/server.config.js";
import { staticAssetManifest } from "./config/asset-manifest.js";
import { api } from "./api/routes.js";

const staticServer = createStaticServer(staticAssetManifest, serverConfig);

const app = new Hono();

// Mount API routes for production
app.route("/api", api);

// Handle static files - this should come after API routes
app.get("*", async (c) => {
  return staticServer.serveRequest(c.req.raw);
});

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.fetch(event.request));
});
