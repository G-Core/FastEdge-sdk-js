# Static Sites

Serve static websites (HTML, CSS, JS, images) directly from the edge by embedding files into a WebAssembly binary. No filesystem or CDN origin required — all assets are loaded from WASM memory.

## How It Works

1. **fastedge-init** scaffolds a project with `type: 'static'` configuration
2. **fastedge-build** scans your static directory, generates a manifest, and inlines all files into the WASM binary during compilation
3. At runtime, the embedded static server serves files from memory with correct MIME types, caching headers, and optional compression

Files are read during the Wizer pre-initialization phase (build time), not at request time. This means zero startup latency and no filesystem dependencies.

## Quick Start

```bash
# 1. Scaffold a static site project
npx fastedge-init
# Select "Static website" → provide your public directory

# 2. Build
npx fastedge-build --config .fastedge/build-config.js

# 3. Deploy the output .wasm file
```

## Configuration

### Build Config

Created by `fastedge-init` at `.fastedge/build-config.js`:

```js
const config = {
  type: 'static',
  entryPoint: '.fastedge/static-index.js',
  wasmOutput: './dist/app.wasm',
  publicDir: './public',
  assetManifestPath: '.fastedge/manifest.ts',
  ignoreDotFiles: true,
  ignoreDirs: ['./node_modules'],
  ignoreWellKnown: false,
};
```

| Field | Type | Description |
|-------|------|-------------|
| `publicDir` | `string` | Root directory of static files |
| `assetManifestPath` | `string` | Where to write the generated manifest |
| `ignoreDotFiles` | `boolean` | Skip files starting with `.` |
| `ignoreDirs` | `string[]` | Directories to exclude from manifest |
| `ignoreWellKnown` | `boolean` | Skip `.well-known/` directory |

### Server Config

Controls how the static server behaves at runtime:

```js
const serverConfig = {
  publicDirPrefix: '',
  extendedCache: [],
  compression: [],
  notFoundPage: '/404.html',
  autoIndex: ['index.html', 'index.htm'],
  autoExt: [],
  spaEntrypoint: null,
};
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `publicDirPrefix` | `string` | `''` | URL prefix for all static files |
| `extendedCache` | `(string \| RegExp)[]` | `[]` | Patterns for long-cache headers |
| `compression` | `string[]` | `[]` | Enabled compression types |
| `notFoundPage` | `string \| null` | `'/404.html'` | Custom 404 page path |
| `autoIndex` | `string[]` | `['index.html', 'index.htm']` | Default index files for directories |
| `autoExt` | `string[]` | `[]` | Auto-append file extensions |
| `spaEntrypoint` | `string \| null` | `null` | SPA fallback file |

## Using createStaticServer

For advanced control, use the `createStaticServer` API directly in your entry point:

```js
import { createStaticServer } from '@gcoredev/fastedge-sdk-js';
import manifest from './manifest.ts';

// IMPORTANT: Must be at top level (runs during Wizer pre-initialization)
const server = createStaticServer(manifest, {
  notFoundPage: '/404.html',
  autoIndex: ['index.html'],
  compression: [],
});

addEventListener('fetch', (event) => {
  event.respondWith(server.serveRequest(event.request));
});
```

### StaticServer API

| Method | Returns | Description |
|--------|---------|-------------|
| `serveRequest(request)` | `Promise<void \| Response>` | Serve a request from embedded assets |
| `readFileString(path)` | `Promise<string>` | Read an embedded file as string |

### Critical Constraint

`createStaticServer()` **must be called at the top level** of your module, not inside a function or event handler. It runs during Wizer pre-initialization to load files into memory. Calling it at request time will fail.

## Migration from v1

If upgrading from SDK v1:

```js
// v1 (deprecated)
import { getStaticServer, createStaticAssetsCache } from '@gcoredev/fastedge-sdk-js';
const server = getStaticServer(config, createStaticAssetsCache(manifest));

// v2 (current)
import { createStaticServer } from '@gcoredev/fastedge-sdk-js';
const server = createStaticServer(manifest, config);
```

## See Also

- [fastedge-assets CLI](ASSETS_CLI.md) — standalone manifest generation
- [fastedge-build CLI](BUILD_CLI.md) — build options for static sites
- [fastedge-init CLI](INIT_CLI.md) — scaffold a static site project
- [SDK Runtime API](SDK_API.md) — runtime APIs available in static apps
