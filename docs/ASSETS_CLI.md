# fastedge-assets CLI

Generate a static asset manifest file that maps your static files for embedding in a WebAssembly binary.

## Usage

```bash
# Positional arguments
npx fastedge-assets <input-directory> <output-file>
npx fastedge-assets ./public ./src/manifest.ts

# Named options
npx fastedge-assets --input ./public --output ./src/manifest.ts

# Config-driven
npx fastedge-assets --config .fastedge/build-config.js

# Help and version
npx fastedge-assets --help
npx fastedge-assets --version
```

## Options

| Flag | Alias | Type | Description |
|------|-------|------|-------------|
| `--input` | `-i` | String | Input directory containing static files |
| `--output` | `-o` | String | Output manifest file path |
| `--config` | `-c` | String | Path to build config file |
| `--help` | `-h` | Boolean | Show help |
| `--version` | `-v` | Boolean | Show version |

**Note:** Input must be a directory. Output must be a file path.

## What It Does

`fastedge-assets` scans a directory of static files and generates a TypeScript manifest file that maps each file's:

- **Path** — the URL path the file will be served at
- **Content type** — MIME type based on file extension
- **Size** — file size in bytes
- **Asset path** — filesystem path to the file

This manifest is used during the `fastedge-build` static compilation to inline all files into the WASM binary.

## Manifest Structure

The generated manifest maps URL paths to asset metadata:

```typescript
// Generated manifest example
export const manifest = {
  '/index.html': {
    assetKey: '/index.html',
    contentType: 'text/html',
    fileInfo: { size: 1234, assetPath: './public/index.html' },
    type: 'wasm-inline',
  },
  '/styles.css': {
    assetKey: '/styles.css',
    contentType: 'text/css',
    fileInfo: { size: 567, assetPath: './public/styles.css' },
    type: 'wasm-inline',
  },
};
```

## When to Use

- **Standalone usage:** Generate a manifest separately before building
- **Automatic:** When using `fastedge-build` with `type: 'static'`, the manifest is generated automatically as part of the build — you don't need to run `fastedge-assets` separately

## See Also

- [Static Sites](STATIC_SITES.md) — full static site workflow
- [fastedge-build CLI](BUILD_CLI.md) — compilation with static config
- [fastedge-init CLI](INIT_CLI.md) — scaffold a static site project
