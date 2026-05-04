# fastedge-assets CLI

Generates a static asset manifest file that maps a directory of static files for embedding into a FastEdge WebAssembly binary.

## Overview

`fastedge-assets` scans a source directory and produces a JavaScript/TypeScript module exporting a `staticAssetManifest` object. This manifest is consumed at compile time by `fastedge-build` to embed file contents directly into the WASM binary via Wizer processing. The embedded assets are available at runtime without a file system.

Run `fastedge-assets` as a pre-build step, before invoking `fastedge-build`.

## Usage

```sh
# Positional arguments
npx fastedge-assets <input-directory> <output-file>
npx fastedge-assets ./public ./src/manifest.ts

# Named flags
npx fastedge-assets --input ./public --output ./src/manifest.ts

# Config-driven
npx fastedge-assets --config .fastedge/asset-config.js

# Help and version
npx fastedge-assets --help
npx fastedge-assets --version
```

## Flags

| Flag              | Alias | Type      | Description                                                                  |
| ----------------- | ----- | --------- | ---------------------------------------------------------------------------- |
| `--input <path>`  | `-i`  | `string`  | Path to the directory of source assets (e.g. `./public`)                     |
| `--output <file>` | `-o`  | `string`  | Output file path for the generated manifest (e.g. `./src/asset-manifest.ts`) |
| `--config <file>` | `-c`  | `string`  | Path to an asset config file containing `AssetCacheConfig` fields            |
| `--version`       | `-v`  | `boolean` | Print the package version                                                     |
| `--help`          | `-h`  | `boolean` | Print usage information                                                       |

**Notes:**

- `--input` must resolve to an existing directory.
- `--output` must resolve to a file path (not a directory). The output file does not need to pre-exist; parent directories are created automatically.
- When `--config` is provided, `publicDir` and `assetManifestPath` from the config file serve as defaults if `--input` or `--output` are not specified on the command line.
- If the output path does not end with `.js`, `.ts`, `.cjs`, or `.mjs`, a `.js` extension is appended automatically.

## Config File

When using `--config`, the config file must export an object conforming to `AssetCacheConfig`:

```ts
interface AssetCacheConfig extends Record<string, unknown> {
  publicDir:         string;
  assetManifestPath: string;
  contentTypes:      Array<ContentTypeDefinition>;
  ignoreDotFiles:    boolean;
  ignorePaths:       string[];
  ignoreWellKnown:   boolean;
}
```

Example config (`.fastedge/asset-config.js`):

```js
export default {
  publicDir: './public',
  assetManifestPath: './.fastedge/build/static-asset-manifest.js',
  ignoreDotFiles: true,
  ignoreWellKnown: false,
  ignorePaths: ['./public/drafts'],
  contentTypes: [
    {
      test: /\.webp$/u,
      contentType: 'image/webp',
      isText: false,
    },
  ],
};
```

### Config Fields

| Field               | Type                      | Description                                                            |
| ------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `publicDir`         | `string`                  | Directory to scan for static files                                     |
| `assetManifestPath` | `string`                  | Output manifest file path                                              |
| `contentTypes`      | `ContentTypeDefinition[]` | Custom content type matchers prepended before built-in defaults        |
| `ignoreDotFiles`    | `boolean`                 | When `true`, excludes files and directories whose names begin with `.` |
| `ignorePaths`       | `string[]`                | Additional paths to exclude from the manifest                          |
| `ignoreWellKnown`   | `boolean`                 | When `true`, excludes the `.well-known` directory                      |

### ContentTypeDefinition

```ts
interface ContentTypeDefinition {
  test:        RegExp | ((assetKey: string) => boolean);
  contentType: string;
  isText:      boolean;
}
```

| Field         | Type                                        | Description                                                             |
| ------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `test`        | `RegExp \| ((assetKey: string) => boolean)` | Pattern or function matched against each asset's URL path               |
| `contentType` | `string`                                    | MIME type assigned to matched assets (e.g. `"image/webp"`)              |
| `isText`      | `boolean`                                   | Whether the file should be treated as text (`true`) or binary (`false`) |

Custom content types are evaluated before built-in defaults. The first matching entry wins.

## Manifest Structure

The generated file exports a `staticAssetManifest` constant:

```ts
type StaticAssetManifest = Record<string, StaticAssetMetadata>;

interface StaticAssetMetadata {
  type:        string;
  assetKey:    string;
  contentType: string;
  isText:      boolean;
  fileInfo:    FileInfo;
}

interface FileInfo {
  hash:             string;
  size:             number;
  assetPath:        string;
  lastModifiedTime: number;
}
```

| Field                       | Type      | Description                                               |
| --------------------------- | --------- | --------------------------------------------------------- |
| `type`                      | `string`  | Always `"wasm-inline"` for assets generated by this tool  |
| `assetKey`                  | `string`  | URL path key used to look up the asset at runtime         |
| `contentType`               | `string`  | MIME type (e.g. `"text/css"`, `"image/png"`)              |
| `isText`                    | `boolean` | Whether the content is text or binary                     |
| `fileInfo.hash`             | `string`  | SHA-256 hex hash of the file contents                     |
| `fileInfo.size`             | `number`  | File size in bytes                                        |
| `fileInfo.assetPath`        | `string`  | Original file path at the time the manifest was generated |
| `fileInfo.lastModifiedTime` | `number`  | File last-modified timestamp (Unix seconds)               |

Example generated output:

```js
/*
 * DO NOT EDIT THIS FILE - Generated by @gcoredev/FastEdge-sdk-js
 *
 * It will be overwritten on the next build.
 */

const staticAssetManifest = {
  '/index.css': {
    assetKey: '/index.css',
    contentType: 'text/css',
    isText: true,
    fileInfo: {
      size: 466,
      hash: 'e17878bc37ca054789c91f5c24e6044a077e172d2c65454a71269a82e61ee686',
      lastModifiedTime: 1768985591,
      assetPath: './styles/index.css',
    },
    lastModifiedTime: 1768985591,
    type: 'wasm-inline',
  },
};

export { staticAssetManifest };
```

## Default Content Types

The following MIME types are detected automatically by file extension. Custom `contentTypes` entries are checked first.

| Extension(s)          | Content-Type                    | Text |
| --------------------- | ------------------------------- | ---- |
| `.txt`                | `text/plain`                    | yes  |
| `.html`, `.htm`       | `text/html`                     | yes  |
| `.xml`                | `application/xml`               | yes  |
| `.json`               | `application/json`              | yes  |
| `.map`                | `application/json`              | yes  |
| `.js`                 | `application/javascript`        | yes  |
| `.ts`                 | `application/typescript`        | yes  |
| `.css`                | `text/css`                      | yes  |
| `.svg`                | `image/svg+xml`                 | yes  |
| `.bmp`                | `image/bmp`                     | no   |
| `.png`                | `image/png`                     | no   |
| `.gif`                | `image/gif`                     | no   |
| `.jpg`, `.jpeg`       | `image/jpeg`                    | no   |
| `.ico`                | `image/vnd.microsoft.icon`      | no   |
| `.tif`, `.tiff`       | `image/png`                     | no   |
| `.aac`                | `audio/aac`                     | no   |
| `.mp3`                | `audio/mpeg`                    | no   |
| `.avi`                | `video/x-msvideo`               | no   |
| `.mp4`                | `video/mp4`                     | no   |
| `.mpeg`               | `video/mpeg`                    | no   |
| `.webm`               | `video/webm`                    | no   |
| `.pdf`                | `application/pdf`               | no   |
| `.tar`                | `application/x-tar`             | no   |
| `.zip`                | `application/zip`               | no   |
| `.eot`                | `application/vnd.ms-fontobject` | no   |
| `.otf`                | `font/otf`                      | no   |
| `.ttf`                | `font/ttf`                      | no   |
| `.woff`               | `font/woff`                     | no   |
| `.woff2`              | `font/woff2`                    | no   |
| (no match)            | `application/octet-stream`      | no   |

## When to Use

**Use `fastedge-assets` directly when:**

- You are building an HTTP app and need to embed specific asset directories individually.
- You want separate manifests per asset group (e.g. one manifest for images, another for templates).
- You need control over which directories are scanned and what the output file is named.

**You do not need to run `fastedge-assets` directly when:**

- You are using `fastedge-build` with a `static` build type configured in a `build-config.js`. In that mode, `fastedge-build` invokes the manifest generator automatically as part of the build pipeline.

## Example: Multiple Manifests in One Project

The following `package.json` generates three separate manifests before building:

```json
{
  "scripts": {
    "build": "npm-run-all -s create-styles-manifest create-images-manifest create-templates-manifest build:wasm",
    "create-styles-manifest":    "npx fastedge-assets ./styles    src/styles-static-assets.ts",
    "create-images-manifest":    "npx fastedge-assets ./images    src/images-static-assets.ts",
    "create-templates-manifest": "npx fastedge-assets ./templates src/templates-static-assets.ts",
    "build:wasm": "npx fastedge-build -i ./src/index.tsx -o ./dist/app.wasm -t ./tsconfig.json"
  }
}
```

Each generated manifest is imported and passed to `createStaticServer` at the top level of your entry point. Because Wizer snapshots all top-level code before creating the binary, `createStaticServer` must be called at the top level — not inside a function or async handler.

```ts
/// <reference types="@gcoredev/fastedge-sdk-js" />
import { createStaticServer } from '@gcoredev/fastedge-sdk-js';
import { staticAssetManifest as imageManifest }    from './images-static-assets.js';
import { staticAssetManifest as styleManifest }    from './styles-static-assets.js';
import { staticAssetManifest as templateManifest } from './templates-static-assets.js';

// Called at top level so Wizer embeds assets into the binary at compile time
const imageServer    = createStaticServer(imageManifest,    { routePrefix: '/images' });
const styleServer    = createStaticServer(styleManifest,    { routePrefix: '/styles' });
const templateServer = createStaticServer(templateManifest, {});

addEventListener('fetch', (event) => {
  event.respondWith(imageServer.serveRequest(event.request));
});
```

## See Also

- [Static Sites](STATIC_SITES.md) — full static site workflow with embedded assets
- [fastedge-build CLI](BUILD_CLI.md) — compile JavaScript/TypeScript to WebAssembly
- [fastedge-init CLI](INIT_CLI.md) — scaffold a new FastEdge project
- [SDK Runtime API](SDK_API.md) — runtime APIs available inside FastEdge applications
