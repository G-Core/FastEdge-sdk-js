# fastedge-assets CLI

Generates a static asset manifest file that maps a directory of static files for embedding into a FastEdge WebAssembly binary.

## Overview

`fastedge-assets` scans a source directory and produces a JavaScript/TypeScript module exporting a `staticAssetManifest` object. When an app that imports this manifest is built with `fastedge-build`, the file contents are embedded into the WASM binary via Wizer processing. The embedded assets are available at runtime without a file system.

`fastedge-assets` is needed when an app embeds a manifest outside a static build, for example an HTTP app that serves files with `createStaticServer`. A `fastedge-build` run with `type: 'static'` generates the manifest itself, so `fastedge-assets` is not a required pre-build step for every build.

## Usage

```sh
# Positional arguments
npx fastedge-assets <input-directory> <output-file>
npx fastedge-assets ./public ./src/manifest.ts

# Named flags
npx fastedge-assets --input ./public --output ./src/manifest.ts

# Config-driven
npx fastedge-assets --config .fastedge/asset-config.mjs

# Config file with a command-line override of the input directory
npx fastedge-assets --config .fastedge/asset-config.mjs --input ./public

# Help and version
npx fastedge-assets --help
npx fastedge-assets --version
```

Running `fastedge-assets` with no arguments prints the usage information and exits with status 0.

## Flags

| Flag              | Alias | Type      | Description                                                                  |
| ----------------- | ----- | --------- | ---------------------------------------------------------------------------- |
| `--input <path>`  | `-i`  | `string`  | Path to the non-empty directory of source assets (e.g. `./public`)           |
| `--output <file>` | `-o`  | `string`  | Output file path for the generated manifest (e.g. `./src/asset-manifest.ts`) |
| `--config <file>` | `-c`  | `string`  | Path to an asset config file containing `AssetCacheConfig` fields            |
| `--version`       | `-v`  | `boolean` | Print the package version                                                    |
| `--help`          | `-h`  | `boolean` | Print usage information                                                      |

**Notes:**

- `--input` must be an existing, non-empty directory.
- `--output` must resolve to a file path (not a directory). The output file does not need to pre-exist; parent directories are created automatically.
- Input and output paths are resolved relative to the current working directory. Use paths relative to the directory the command is run from.
- Two positional arguments are interpreted as `<input-directory> <output-file>` and take precedence over `--input` and `--output`.
- When `--config` is provided, `publicDir` and `assetManifestPath` from the config file serve as defaults if `--input` or `--output` are not specified on the command line (or as positional arguments).
- If the `--config` file does not exist, or the config contains no fields, usage information is printed and the process exits with status 1. If the config file exists but fails to import, the error is thrown and usage information is not printed.
- If the output path does not end with `.js`, `.ts`, `.cjs`, or `.mjs`, a warning is printed and a `.js` extension is appended automatically.
- If the input is not an existing non-empty directory or the output is not a file path, an error is printed, followed by usage information, and the process exits with status 1.
- All other settings (`contentTypes`, `ignoreDotFiles`, `ignorePaths`, `ignoreWellKnown`) can only be set through the config file.

## Config File

When using `--config`, the config file must export an object named `config`, conforming to `AssetCacheConfig`. Use a named export (`export { config }` or `export const config = ...`). A default export is not read.

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

Example config (`.fastedge/asset-config.mjs`):

```js
const config = {
  publicDir: './public',
  assetManifestPath: './.fastedge/build/static-asset-manifest.js',
  ignoreDotFiles: true,
  ignoreWellKnown: false,
  ignorePaths: ['/drafts'],
  contentTypes: [
    {
      test: /\.webp$/u,
      contentType: 'image/webp',
      isText: false,
    },
  ],
};

export { config };
```

### Config Fields

| Field               | Type                      | Default | Description                                                                        |
| ------------------- | ------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `publicDir`         | `string`                  | none    | Directory to scan for static files. Used when `--input` is not given               |
| `assetManifestPath` | `string`                  | none    | Output manifest file path. Used when `--output` is not given                       |
| `contentTypes`      | `ContentTypeDefinition[]` | `[]`    | Custom content type matchers checked before the built-in types                     |
| `ignoreDotFiles`    | `boolean`                 | `true`  | When `true`, excludes dot files and directories (except `.well-known`)             |
| `ignorePaths`       | `string[]`                | `[]`    | Paths to exclude, relative to `publicDir`, e.g. `'/drafts'`. Exact match, no globs |
| `ignoreWellKnown`   | `boolean`                 | `false` | When `true`, excludes the `.well-known` directory                                  |

`ignorePaths` entries are relative to `publicDir`. Each entry is normalized to start with a single `/` (a leading `./` and trailing slashes are removed) and is compared exactly against the path of each file or directory under `publicDir`. Glob patterns are not supported. A matching directory is excluded together with everything inside it. For example, with `publicDir: './public'`, use `'/drafts'` to exclude `./public/drafts`.

A legacy `ignoreDirs` array is still read as an alias for `ignorePaths`; new configs should use `ignorePaths`.

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
| `test`        | `RegExp \| ((assetKey: string) => boolean)` | Pattern or function matched against each asset's lowercased URL path    |
| `contentType` | `string`                                    | MIME type assigned to matched assets (e.g. `"image/webp"`)              |
| `isText`      | `boolean`                                   | Whether the file should be treated as text (`true`) or binary (`false`) |

Custom content types are evaluated before built-in defaults. The first matching entry wins. If `isText` is omitted it is treated as `false`. An entry is skipped with a warning if `test` is not a function or regular expression, or if `contentType` is not a string containing a `/`. If `contentTypes` is not an array, it is treated as an empty array and ignored without a warning.

## Included Files

All files under `publicDir` are included, subject to `ignoreDotFiles`, `ignoreWellKnown` and `ignorePaths`.

Symlinks are handled as follows:

- A symlink is followed only when it resolves to a regular file inside `publicDir`. The asset is keyed by the path of the link.
- Symlinks to directories, symlinks pointing outside `publicDir`, and broken symlinks are skipped. A warning is printed for each skipped link.

## Manifest Structure

The generated file exports a `staticAssetManifest` constant:

```ts
type StaticAssetManifest = Record<string, StaticAssetMetadata>;

interface StaticAssetMetadata {
  type:             string;
  assetKey:         string;
  contentType:      string;
  isText:           boolean;
  fileInfo:         FileInfo;
  lastModifiedTime: number;
}

interface FileInfo {
  hash:             string;
  size:             number;
  assetPath:        string;
  lastModifiedTime: number;
}
```

| Field                       | Type      | Description                                              |
| --------------------------- | --------- | -------------------------------------------------------- |
| `type`                      | `string`  | Always `"wasm-inline"` for assets generated by this tool |
| `assetKey`                  | `string`  | URL path key used to look up the asset at runtime        |
| `contentType`               | `string`  | MIME type (e.g. `"text/css"`, `"image/png"`)             |
| `isText`                    | `boolean` | Whether the content is text or binary                    |
| `fileInfo.hash`             | `string`  | SHA-256 hex hash of the file contents                    |
| `fileInfo.size`             | `number`  | File size in bytes                                       |
| `fileInfo.assetPath`        | `string`  | Source file path relative to the working directory       |
| `fileInfo.lastModifiedTime` | `number`  | File last-modified timestamp (Unix seconds)              |
| `lastModifiedTime`          | `number`  | Same value as `fileInfo.lastModifiedTime`                |

Each manifest entry is keyed by its `assetKey`, the file's path relative to `publicDir` with a leading `/`.

Keys and values are written with `JSON.stringify`, so keys are double-quoted and each entry is written on a single line without spaces. Example generated output:

```js
/*
 * DO NOT EDIT THIS FILE - Generated by @gcoredev/FastEdge-sdk-js
 *
 * It will be overwritten on the next build.
 */

const staticAssetManifest = {
  "/index.css": {"assetKey":"/index.css","contentType":"text/css","isText":true,"fileInfo":{"size":466,"hash":"e17878bc37ca054789c91f5c24e6044a077e172d2c65454a71269a82e61ee686","lastModifiedTime":1768985591,"assetPath":"./styles/index.css"},"lastModifiedTime":1768985591,"type":"wasm-inline"},
};

export { staticAssetManifest };
```

## Default Content Types

The following MIME types are detected automatically by file extension. Custom `contentTypes` entries are checked first. A file that matches no entry is assigned `application/octet-stream` and a warning is printed.

| Extension(s)    | Content-Type                    | Text |
| --------------- | ------------------------------- | ---- |
| `.txt`          | `text/plain`                    | yes  |
| `.html`, `.htm` | `text/html`                     | yes  |
| `.xml`          | `application/xml`               | yes  |
| `.json`         | `application/json`              | yes  |
| `.map`          | `application/json`              | yes  |
| `.js`           | `application/javascript`        | yes  |
| `.ts`           | `application/typescript`        | yes  |
| `.css`          | `text/css`                      | yes  |
| `.svg`          | `image/svg+xml`                 | yes  |
| `.bmp`          | `image/bmp`                     | no   |
| `.png`          | `image/png`                     | no   |
| `.gif`          | `image/gif`                     | no   |
| `.jpg`, `.jpeg` | `image/jpeg`                    | no   |
| `.ico`          | `image/vnd.microsoft.icon`      | no   |
| `.tif`, `.tiff` | `image/png`                     | no   |
| `.aac`          | `audio/aac`                     | no   |
| `.mp3`          | `audio/mpeg`                    | no   |
| `.avi`          | `video/x-msvideo`               | no   |
| `.mp4`          | `video/mp4`                     | no   |
| `.mpeg`         | `video/mpeg`                    | no   |
| `.webm`         | `video/webm`                    | no   |
| `.pdf`          | `application/pdf`               | no   |
| `.tar`          | `application/x-tar`             | no   |
| `.zip`          | `application/zip`               | no   |
| `.eot`          | `application/vnd.ms-fontobject` | no   |
| `.otf`          | `font/otf`                      | no   |
| `.ttf`          | `font/ttf`                      | no   |
| `.woff`         | `font/woff`                     | no   |
| `.woff2`        | `font/woff2`                    | no   |
| (no match)      | `application/octet-stream`      | no   |

Extensions are matched against the lowercased asset path.

## When to Use

**Use `fastedge-assets` directly when:**

- You are building an HTTP app (for example one using `createStaticServer`) and need to embed a manifest outside a static build.
- You want separate manifests per asset group (e.g. one manifest for images, another for templates).
- You need control over which directories are scanned and what the output file is named.

**You do not need to run `fastedge-assets` directly when:**

- You are using `fastedge-build` with a `static` build type configured in a `build-config.js`. In that mode, `fastedge-build` generates the manifest itself as part of the build pipeline.

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
