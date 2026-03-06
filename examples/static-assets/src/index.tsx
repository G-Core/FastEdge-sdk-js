import { Hono } from "hono";

import { createStaticServer } from "@gcoredev/fastedge-sdk-js";

import { staticAssetManifest as imagesStaticAssets } from "./images-static-assets";
import { staticAssetManifest as stylesStaticAssets } from "./styles-static-assets";
import { staticAssetManifest as templatesStaticAssets } from "./templates-static-assets";

import { JsxContent } from "./jsx-page";

const imagesStaticServer = createStaticServer(imagesStaticAssets, {
  routePrefix: "images",
});

const stylesStaticServer = createStaticServer(stylesStaticAssets, {
  routePrefix: "styles",
});

const templatesStaticServer = createStaticServer(templatesStaticAssets, {});

const app = new Hono();

app.get("/", async (c) => {
  return c.html(
    <html>
      <head>
        <title>Test Site</title>
        <link rel="stylesheet" href="/styles/index.css"></link>
      </head>
      <body>
        <h1>Home Page</h1>
        <p>Basic HTML rendering</p>
        <div class="nav-link">
          <a href="/jsx">Go to React JSX Page</a>
        </div>
        <div class="nav-link">
          <a href="/template">Template String Page</a>
        </div>
      </body>
    </html>
  );
});

app.get("/jsx", async (c) => {
  const props = {
    name: "World",
    siteData: {
      title: "Hello <> World",
      description: "This is a description",
    },
  };
  return c.html(<JsxContent {...props} />);
});

app.get("/styles/*", async (c) => {
  return stylesStaticServer.serveRequest(c.req.raw);
});

app.get("/images/*", async (c) => {
  return imagesStaticServer.serveRequest(c.req.raw);
});

app.get("/template", async (c) => {
  const templateString = await templatesStaticServer.readFileString(
    "/index.html"
  );
  return c.html(templateString);
});

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.fetch(event.request));
});
