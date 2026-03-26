---
title: Creating a Static Asset Manifest
description: How to generate a static-asset-manifest for creating Static Servers.
---

Apart from using `npx fastedge-init` to create Static Sites you can also access the built-in tools
directly.

`npx fastedge-init` is using this concept under the hood.

## Static files

Because the `wasm` runtime has no concept of a file system we are unable to serve static files in
the normal manner.

To solve for this we are able to read files at `compile` time and store them within the wasm binary
itself as a UintArrayBuffer.

For this purpose the FastEdge-sdk-js provides a `npx fastedge-assets` command.

### fastedge-assets

This command takes an input folder and an output filename.

e.g.

```sh
npx fastedge-assets ./public ./src/public-static-assets.ts
```

It then creates a "Static Assets Manifest" file which is a mapping of all files to include within
the binary at compile time. (i.e. all files within the `/public` directory)

Simplified example:

```js
const staticAssetManifest = {
  '/gcore.png': {
    assetKey: '/gcore.png',
    contentType: 'image/png',
    fileInfo: { size: 40261, assetPath: './images/gcore.png' },
    type: 'wasm-inline',
  },
  '/home.png': {
    assetKey: '/home.png',
    contentType: 'image/png',
    fileInfo: { size: 1502064, assetPath: './images/home.png' },
    type: 'wasm-inline',
  },
};

export { staticAssetManifest };
```

This `manifest` can then be consumed by creating a Static Server using:

```js
import { createStaticServer } from '@gcoredev/fastedge-sdk-js';

createStaticServer(staticAssetManifest, serverConfig);
```

Because
<a href='https://github.com/bytecodealliance/wizer' target='_blank' rel='noopener noreferrer'>wizer</a>
runs all top-level code before taking a snapshot, you need to ensure that `createStaticServer()` is
called within the main file at the top level. It cannot be nested in functions or async code that
may not run during compilation.

This ensures that `staticAssetManifest` is iterated over and all files read into wasm memory. After
which `wizer` snapshots the current state, and creates the final wasm binary with all the file
contents included within the memory at startup. This process ensures there is **NO** start-up delay
and all files are available at runtime.

There is a more complete example in our
<a href='https://github.com/G-Core/FastEdge-examples/blob/main/javascript/README.md' target='_blank' rel='noopener noreferrer'>FastEdge-examples</a>
repo.
