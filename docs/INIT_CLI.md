# fastedge-init CLI

Interactive scaffolding tool that generates build configuration and starter files for a new FastEdge application.

## Usage

```bash
npx fastedge-init
```

`fastedge-init` has no flags. All configuration is collected interactively. Run it from the root of your project directory.

If `.fastedge/build-config.js` already exists, the tool warns you and asks whether to overwrite it before proceeding. The confirmation defaults to `No`: answering `N` or pressing Enter exits without making changes.

When a prompt receives invalid input (see the validation columns below), the tool prints an error and exits with a non-zero status. The one exception is the SPA entrypoint prompt, which prints a warning and continues.

## Application Types

The first prompt asks what you are building:

| Option               | Description                                       |
| -------------------- | ------------------------------------------------- |
| `Http event-handler` | A request/response handler compiled to WASM       |
| `Static website`     | A static file server with assets embedded in WASM |

## HTTP Handler Setup

### Prompts

| Prompt                   | Default                    | Validation               |
| ------------------------ | -------------------------- | ------------------------ |
| Path to your entry file  | `src/index.js`             | Must be an existing file |
| Path to your output file | `.fastedge/dist/main.wasm` | Must end with `.wasm`    |

### Files Created

| File                        | Description                           |
| --------------------------- | ------------------------------------- |
| `.fastedge/build-config.js` | Build and server configuration module |

### Generated Config

`.fastedge/build-config.js` exports two named objects using the values from the prompts. The objects are written as JSON, so keys and string values are double-quoted:

```js
const config = {
  "type": "http",
  "tsConfigPath": "./tsconfig.json",
  "entryPoint": "src/index.js",
  "wasmOutput": ".fastedge/dist/main.wasm"
};

const serverConfig = {
  "type": "http"
};

export { config, serverConfig };
```

#### Build Config (`config`)

| Field          | Type     | Default                    | Description                            |
| -------------- | -------- | -------------------------- | -------------------------------------- |
| `type`         | `string` | `"http"`                   | Build type identifier                  |
| `tsConfigPath` | `string` | `./tsconfig.json`          | Path to TypeScript configuration       |
| `entryPoint`   | `string` | `src/index.js`             | Path to your entry file                |
| `wasmOutput`   | `string` | `.fastedge/dist/main.wasm` | Output path for the compiled WASM file |

### Entry File

Your entry file must register a `fetch` event listener at the top level:

```js
async function handleRequest(event) {
  return new Response('Hello from FastEdge!', {
    headers: { 'Content-Type': 'text/plain' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
```

### Build Command

After initialization, compile the application:

```bash
npx fastedge-build --config .fastedge/build-config.js
```

## Static Website Setup

`.fastedge/static-index.js` is written before the prompts are shown. The remaining files are written after all prompts are answered.

### Prompts

| Prompt                                   | Default                        | Validation                                             |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| Path to your output file                 | `.fastedge/dist/fastedge.wasm` | Must end with `.wasm`                                  |
| Path to your public directory            | `./build`                      | Directory must exist and not be empty                  |
| Is your site a single page application?  | `No`                           | —                                                      |
| Path to your SPA entrypoint _(SPA only)_ | `./index.html`                 | Warns if the file is not found in the public directory |

For a single page application, the existence check looks for the entered path inside the public directory. If the file is not found, a warning is printed and `spaEntrypoint` is left unset (written as `null`). Otherwise `spaEntrypoint` is set to the normalized form of the path entered at the prompt.

### Files Created

| File                        | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `.fastedge/static-index.js` | Generated entry file that wires the static server together   |
| `.fastedge/build-config.js` | Build and server configuration module                        |
| `.fastedge/package.json`    | Marks `.fastedge/` as an ES module project                   |
| `.fastedge/jsconfig.json`   | Sets the compiler target to ES2023 for the project directory |

### Generated Entry File

`.fastedge/static-index.js` is generated automatically and should not be edited manually:

```js
/*
 * Generated by @gcoredev/FastEdge-sdk-js fastedge-init
 */

import { createStaticServer } from "@gcoredev/fastedge-sdk-js";
import { staticAssetManifest } from "./build/static-asset-manifest.js";
import { serverConfig } from "./build-config.js";

const staticServer = createStaticServer(staticAssetManifest, serverConfig);

async function handleRequest(event) {
  const response = await staticServer.serveRequest(event.request);
  if (response != null) {
    return response;
  }

  return new Response("Not found", { status: 404 });
}

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));
```

The asset manifest imported by this file is generated by `fastedge-build` during the build.

### Generated Project Files

`.fastedge/package.json`:

```json
{
  "name": "fastedge-build",
  "version": "1.0.0",
  "description": "fastedge-build project folder (ES2023)",
  "type": "module"
}
```

`.fastedge/jsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023"
  }
}
```

### Generated Config

`.fastedge/build-config.js` exports two named objects using the values from the prompts. The objects are written as JSON, so keys and string values are double-quoted:

```js
const config = {
  "type": "static",
  "entryPoint": ".fastedge/static-index.js",
  "ignoreDotFiles": true,
  "ignorePaths": [
    "./node_modules"
  ],
  "ignoreWellKnown": false,
  "tsConfigPath": "./tsconfig.json",
  "wasmOutput": ".fastedge/dist/fastedge.wasm",
  "publicDir": "./build"
};

const serverConfig = {
  "type": "static",
  "extendedCache": [],
  "publicDirPrefix": "",
  "compression": [],
  "notFoundPage": "/404.html",
  "autoExt": [],
  "autoIndex": [
    "index.html",
    "index.htm"
  ],
  "spaEntrypoint": null
};

export { config, serverConfig };
```

For a SPA whose entrypoint exists in the public directory, `spaEntrypoint` is set to the normalized path entered at the prompt instead of `null`.

### Config Fields

#### Build Config (`config`)

| Field             | Type       | Default                        | Description                                               |
| ----------------- | ---------- | ------------------------------ | --------------------------------------------------------- |
| `type`            | `string`   | `"static"`                     | Build type identifier                                     |
| `entryPoint`      | `string`   | `.fastedge/static-index.js`    | Path to the generated entry file                          |
| `wasmOutput`      | `string`   | `.fastedge/dist/fastedge.wasm` | Output path for the compiled WASM file                    |
| `publicDir`       | `string`   | `./build`                      | Directory containing static assets to embed               |
| `tsConfigPath`    | `string`   | `./tsconfig.json`              | Path to TypeScript configuration                          |
| `ignoreDotFiles`  | `boolean`  | `true`                         | Exclude dot files and directories (except `.well-known`)  |
| `ignorePaths`     | `string[]` | `["./node_modules"]`           | Paths relative to `publicDir` to exclude; matched exactly |
| `ignoreWellKnown` | `boolean`  | `false`                        | When `true`, excludes the `.well-known/` directory        |

`ignorePaths` entries are relative to `publicDir` and are matched exactly against the path of a file or directory, written with a leading `/` (for example, `/drafts`). Patterns are not supported.

#### Server Config (`serverConfig`)

| Field             | Type                      | Default                       | Description                                                     |
| ----------------- | ------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `type`            | `string`                  | `"static"`                    | Server type identifier                                          |
| `extendedCache`   | `Array<string \| RegExp>` | `[]`                          | Paths or patterns served with extended caching                  |
| `publicDirPrefix` | `string`                  | `""`                          | Prepended to the asset key after `routePrefix` is stripped      |
| `routePrefix`     | `string`                  | —                             | Stripped from the request path; not written by init             |
| `compression`     | `string[]`                | `[]`                          | Accepted but has no effect; content encoding is not implemented |
| `notFoundPage`    | `string \| null`          | `"/404.html"`                 | Asset path served with status 404                               |
| `autoExt`         | `string[]`                | `[]`                          | Extensions tried after a direct miss                            |
| `autoIndex`       | `string[]`                | `["index.html", "index.htm"]` | Index filenames tried when resolving a directory path           |
| `spaEntrypoint`   | `string \| null`          | `null`                        | Asset path served for unmatched HTML requests                   |

`fastedge-init` does not write `routePrefix`; add it to `serverConfig` manually if needed. The generated file is plain JSON, so `extendedCache` entries written by hand in `build-config.js` can also be `RegExp` objects.

#### Server Config Behaviour

For each `GET` or `HEAD` request, the server resolves the asset key from the request path in this order:

1. `routePrefix`, if set, is stripped from the request path.
2. `publicDirPrefix`, if non-empty, is prepended to the result.
3. A leading `/` is added if missing.

The server then looks for a matching asset:

- A path that does not end in `/` is looked up directly. If there is no direct match, each `autoExt` extension is appended in turn and the result is looked up. `autoExt` applies to any path not ending in `/`, whether or not the path already has an extension.
- If no asset has matched, the path is treated as a directory and each `autoIndex` filename is tried in order.

Other behaviour:

- `extendedCache` entries are matched against the request path. An entry is one of:
  - an exact path, such as `'/logo.png'`
  - a path prefix: an entry ending in `/`, such as `'/assets/'`, matches any path that starts with it, and `'/'` matches every path
  - a `RegExp` object
  - a `regex:/pattern/flags` string, such as `'regex:/\\.(js|css)$/i'`; other `regex:` forms are dropped with a warning

  Matching assets are served with `Cache-Control: max-age=31536000`.
- `compression` is accepted but has no effect. Content encoding is not implemented, so assets are always served unencoded regardless of the `Accept-Encoding` header.
- When no asset matches and the request accepts `text/html`, the server serves `spaEntrypoint` (status 200, `Cache-Control: no-store`) if it is set and the asset exists. Otherwise it serves `notFoundPage` (status 404, `Cache-Control: no-store`) if it is set and the asset exists. Both values are asset keys, not paths relative to the public directory.
- An unset `notFoundPage` or `spaEntrypoint` normalizes to `'/'`, which matches no asset, so the feature is effectively off.
- Requests that the server does not handle, such as non-`GET`/`HEAD` methods or unmatched requests that do not accept `text/html`, fall through to the `Not found` 404 response in the generated entry file.

### Build Command

A static site is built with a single command. `fastedge-build` generates the asset manifest from the public directory and then compiles to WASM:

```bash
npx fastedge-build --config .fastedge/build-config.js
```

Run the same command again whenever your static assets change.

## See Also

- [fastedge-build CLI](BUILD_CLI.md) — compile a project to WebAssembly
- [fastedge-assets CLI](ASSETS_CLI.md) — generate static asset manifests
- [Static Sites](STATIC_SITES.md) — static site configuration and serving behaviour
- [Quickstart](quickstart.md) — installation and first build
