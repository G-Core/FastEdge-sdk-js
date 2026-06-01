# fastedge-build CLI

Compile JavaScript or TypeScript source code into a WebAssembly component for deployment on the FastEdge platform.

## Usage

```bash
# Direct mode: specify input and output
npx fastedge-build <input> <output>
npx fastedge-build src/index.js app.wasm

# Named options
npx fastedge-build --input src/index.js --output app.wasm

# Config-driven build
npx fastedge-build --config .fastedge/build-config.js
npx fastedge-build .fastedge/build-config.js  # single positional arg as config file
npx fastedge-build -c                         # uses default config path

# Multiple configs
npx fastedge-build -c config1.js -c config2.js

# Help and version
npx fastedge-build --help
npx fastedge-build --version
```

## Options

| Flag         | Alias | Type       | Description                      |
| ------------ | ----- | ---------- | -------------------------------- |
| `--input`    | `-i`  | `String`   | Input JavaScript/TypeScript file |
| `--output`   | `-o`  | `String`   | Output WebAssembly file path     |
| `--tsconfig` | `-t`  | `String`   | Path to tsconfig.json            |
| `--config`   | `-c`  | `String[]` | Path(s) to build config files    |
| `--help`     | `-h`  | `Boolean`  | Show help                        |
| `--version`  | `-v`  | `Boolean`  | Show version                     |

## Build Modes

### Direct Build

For standard HTTP handler applications, pass input and output paths directly:

```bash
npx fastedge-build src/index.js output.wasm
```

This runs the full compilation pipeline:

1. **esbuild** bundles your JS/TS into a single file
2. **Regex precompilation** transforms Unicode regex for the SpiderMonkey engine
3. **Wizer** pre-initializes the StarlingMonkey runtime with your code
4. **JCO** wraps the result into a WebAssembly Component Model binary

The `--input` and `--output` flags are equivalent to positional arguments:

```bash
npx fastedge-build --input src/index.js --output app.wasm
```

To specify a TypeScript config in direct mode, use `--tsconfig`:

```bash
npx fastedge-build --input src/index.ts --output app.wasm --tsconfig tsconfig.json
```

### Config-Driven Build

For projects using a build config file (created by `fastedge-init`):

```bash
npx fastedge-build --config .fastedge/build-config.js
```

A single positional argument is also accepted as a config file path:

```bash
npx fastedge-build .fastedge/build-config.js
```

Config-driven builds support both `http` and `static` build types. Multiple config files are processed sequentially, each producing its own output `.wasm` file:

```bash
npx fastedge-build -c config-api.js -c config-site.js
```

Running `-c` with no path uses the default config file location resolved at runtime.

## Build Configuration

The config file exports a `config` object matching the `BuildConfig` interface.

### HTTP Config

```js
const config = {
  type: 'http',
  entryPoint: './src/index.js',
  wasmOutput: './dist/app.wasm',
  tsConfigPath: './tsconfig.json',  // optional
};

export { config };
```

### Static Site Config

```js
const config = {
  type: 'static',
  entryPoint: '.fastedge/static-index.js',
  wasmOutput: './dist/app.wasm',
  publicDir: './public',
  assetManifestPath: './src/manifest.ts',
  ignoreDotFiles: true,
  ignorePaths: ['./node_modules'],
  ignoreWellKnown: false,
};

export { config };
```

### BuildConfig Fields

| Field          | Type                 | Required | Description                                        |
| -------------- | -------------------- | -------- | -------------------------------------------------- |
| `type`         | `'http' \| 'static'` | No       | Build type; must be `http` or `static` if provided |
| `entryPoint`   | `string`             | Yes      | Input JavaScript/TypeScript file                   |
| `wasmOutput`   | `string`             | Yes      | Output WASM file path                              |
| `tsConfigPath` | `string`             | No       | Path to tsconfig.json                              |

### Static-Only Fields

When `type` is `'static'`, the following fields from `AssetCacheConfig` apply. Because `BuildConfig extends Partial<AssetCacheConfig>`, all are optional at the type level; however, a static build requires `publicDir` and `assetManifestPath` to produce output.

| Field               | Type                           | Required | Description                                  |
| ------------------- | ------------------------------ | -------- | -------------------------------------------- |
| `publicDir`         | `string`                       | No       | Directory containing static files to embed   |
| `assetManifestPath` | `string`                       | No       | Output path for the generated asset manifest |
| `contentTypes`      | `Array<ContentTypeDefinition>` | No       | Custom content type mappings                 |
| `ignoreDotFiles`    | `boolean`                      | No       | Skip files beginning with `.`                |
| `ignorePaths`       | `string[]`                     | No       | Paths to exclude from the manifest           |
| `ignoreWellKnown`   | `boolean`                      | No       | Skip the `.well-known/` directory            |

### ContentTypeDefinition

```typescript
interface ContentTypeDefinition {
  test:        RegExp | ((assetKey: string) => boolean);
  contentType: string;
  isText:      boolean;
}
```

Custom content-type rules are merged with the built-in defaults. Each rule matches asset paths using either a `RegExp` or a predicate function. Custom rules are evaluated before built-in rules.

## Build Types

### `type: 'http'`

Runs the standard pipeline: esbuild → regex precompilation → Wizer → JCO. Produces a single `.wasm` component from the entry point.

```js
const config = {
  type: 'http',
  entryPoint: 'src/handler.ts',
  wasmOutput: 'dist/handler.wasm',
};

export { config };
```

### `type: 'static'`

Generates a static asset manifest from `publicDir`, embeds it, then runs the standard pipeline. The entry point must read from the manifest at runtime to serve files.

```js
const config = {
  type: 'static',
  entryPoint: 'src/static-handler.ts',
  wasmOutput: 'dist/static-handler.wasm',
  publicDir: 'public',
  assetManifestPath: 'src/asset-manifest.ts',
  ignoreDotFiles: true,
  ignorePaths: ['node_modules'],
  ignoreWellKnown: false,
};

export { config };
```

If `type` is absent or does not match `'http'` or `'static'`, the build exits with an error.

## Output

A successful build writes a `.wasm` file to the path specified by `wasmOutput` (or `--output` in direct mode). The file is a WebAssembly Component Model component compatible with the FastEdge runtime.

In direct mode, on success the CLI prints:

```
Build success!!
"<input>" -> "<output>"
```

In config-driven mode, on success the CLI prints:

```
Success: Built <wasmOutput>
```

On failure the CLI exits with a non-zero status code and prints an error message.

## See Also

- [INIT_CLI.md](INIT_CLI.md) — `fastedge-init` CLI for scaffolding new projects
- [ASSETS_CLI.md](ASSETS_CLI.md) — `fastedge-assets` CLI for asset manifest management
- [STATIC_SITES.md](STATIC_SITES.md) — guide for building and serving static sites
- [SDK_API.md](SDK_API.md) — runtime API reference for handler entry points
