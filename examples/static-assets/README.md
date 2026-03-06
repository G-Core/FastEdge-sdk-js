# Static Asset Server

This is an example to demonstrate how you can use multiple "Static Asset Manifests" and Static Servers to provide files at runtime.

## Static files

Because the `wasm` runtime has no concept of a file system we are unable to serve static files in the normal manner.

To solve for this we are able to read files at `compile` time and store them within the wasm binary itself as a UintArrayBuffer.

For this purpose the `FastEdge-sdk-js` provides a `npx fastedge-assets` command.

## npx fastedge-assets

This command takes an input folder and an output filename.

e.g.

```sh
npx fastedge-assets ./images ./src/images-static-assets.ts
```

It then creates a "Static Assets Manifest" file which is a mapping of all files to include within the binary at compile time. (i.e. all files within the `/images` directory)

Simplified example:

```js
const staticAssetManifest = {
  "/gcore.png": {
    assetKey: "/gcore.png",
    contentType: "image/png",
    fileInfo: { size: 40261, assetPath: "./images/gcore.png" },
    type: "wasm-inline",
  },
  "/home.png": {
    assetKey: "/home.png",
    contentType: "image/png",
    fileInfo: { size: 1502064, assetPath: "./images/home.png" },
    type: "wasm-inline",
  },
};

export { staticAssetManifest };
```

## The Example

Reading through the [server](./src/index.tsx) code you will see the use of:

```js
createStaticServer(staticAssetManifest, serverConfig);
```

Because [wizer](https://github.com/bytecodealliance/wizer) runs all top-level code before taking a snapshot, you need to ensure that `createStaticServer()` is called within this main file at the top level. It cannot be nested in functions or async code that may not run during compilation.

This ensures that `staticAssetManifest` is iterated over and all files read into wasm memory. After which `wizer` snapshots the current state, and creates the final wasm binary with all the file contents included within the memory at startup. This process ensures there is **NO** start-up delay and all files are available at runtime.

### Hono

This example also uses [Hono](https://hono.dev) as its backend server. This allows for rendering JSX syntax directly. [See more](https://hono.dev/docs/guides/jsx)

### Static Servers

This example is a little contrived in as much as it has multiple static servers `images`, `styles` & `templates` which could have all just as easily been in a single folder `./public` and had no need to make multiples. This has been done purely for demonstration purposes.

It demonstrates the 2 ways in which one can use a static server:

```ts
// Top-level and runs at compile time
const assetServer = createStaticServer(staticAssetManifest, serverConfig);

// Within route handlers and runs at runtime
// Option 1:
assetServer.serveRequest(c.req.raw);

// Option 2:
assetServer.readFileString("/index.html");
```

#### serveRequest

This takes a `Request` object and based on the `req.url.pathname` it looks for an asset within the "in-memory" cache and serves this as the `Response`.

Response headers are created from the contentTypes calculated at compile time.

#### readFileString

This allows you to access the content of a file directly. If the file is deemed to be of a `text` type during compilation, this function will return the string contents.

Again the usage of this `readFileString()` function is contrived for the purpose of demonstration, this is **NOT** a recommended way to handle template files.
