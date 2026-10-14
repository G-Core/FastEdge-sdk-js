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
npx fastedge-build -c                         # uses default config path (.fastedge/build-config.js)

# Multiple configs
npx fastedge-build -c config1.js -c config2.js

# Help and version
npx fastedge-build --help
npx fastedge-build --version
```

## Options

| Flag         | Alias | Type       | Description                                                     |
| ------------ | ----- | ---------- | --------------------------------------------------------------- |
| `--input`    | `-i`  | `String`   | Input JavaScript/TypeScript file (direct mode)                  |
| `--output`   | `-o`  | `String`   | Output WebAssembly file path; must end in `.wasm` (direct mode) |
| `--tsconfig` | `-t`  | `String`   | Path to tsconfig for the TypeScript check (direct mode)         |
| `--config`   | `-c`  | `String[]` | Path(s) to build config files; may be repeated                  |
| `--help`     | `-h`  | `Boolean`  | Print usage help                                                |
| `--version`  | `-v`  | `Boolean`  | Print the SDK version                                           |

`-c` given with no path uses `.fastedge/build-config.js`, relative to the current directory. This fallback applies to the short flag `-c` only. A bare `--config` with no path prints the help text and exits with code 0.

`--tsconfig` is used only by the TypeScript check of the input file. esbuild bundles without it. It has no effect for `.js`, `.cjs`, and `.mjs` inputs, and it is not read in config-driven mode; use `tsConfigPath` in the config file instead.

### Argument Rules

The CLI accepts one of the following argument forms:

| Form                                       | Interpretation                           |
| ------------------------------------------ | ---------------------------------------- |
| One positional argument                    | Config file path                         |
| Two positional arguments                   | `<input> <output>` (direct mode)         |
| Options only, no positional arguments      | Direct mode or config-driven mode        |
| Positional arguments combined with options | Invalid; help is printed and exit code 1 |
| No arguments                               | Invalid; help is printed and exit code 1 |

`--help` on its own prints the help text and exits with code 0. `--version` on its own prints `@gcoredev/fastedge-sdk-js: <version>` and exits with code 0. If both are given, help takes precedence.

Unrecognized flags are collected as positional arguments and are subject to the rules above. If an option that requires a value is given without one (other than `-c`, which falls back to the default config path), the help text is printed and the CLI exits with code 0. In direct mode, both an input and an output path must be supplied; otherwise help is printed and the exit code is 1. If both an input/output pair and config files are supplied, the direct build runs and the config files are ignored.

## Build Modes

### Direct Build

For standard HTTP handler applications, pass input and output paths directly:

```bash
npx fastedge-build src/index.js output.wasm
```

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

Running `-c` with no path uses `.fastedge/build-config.js`, relative to the current directory.

## Build Pipeline

Both modes run the same compilation pipeline for each build:

1. **Input validation**: the input must be an existing file, the output path must end in `.wasm`, and the output's parent directory is created if it does not exist.
2. **Syntax / type check** of the input: `.js`, `.cjs`, and `.mjs` files are checked with Node; `.ts`, `.tsx`, and `.jsx` files are checked with the project's TypeScript, which must be installed (`npm install typescript`). Other file extensions are rejected.
3. **esbuild** bundles the input into a single file.
4. **Regex precompilation** rewrites regular expression literals and compiles them during initialization rather than on the first request.
5. **Wizer** pre-initializes the runtime with your code.
6. **Component creation** (`componentNew`) wraps the result into a WebAssembly Component Model binary.
7. **Package metadata** (`addWasmMetadata`) is added to the component.

For `type: 'static'` builds, the asset manifest is generated before this pipeline runs.

## Build Configuration

The config file is an ES module that exports a named `config` object matching the `BuildConfig` interface.

### HTTP Config

```js
const config = {
  type: 'http',
  entryPoint: './src/index.js',
  wasmOutput: './dist/app.wasm',
  tsConfigPath: './tsconfig.json', // optional, used only by the TypeScript check
};

export { config };
```

### Static Site Config

This config matches the entry file generated by `fastedge-init` (`.fastedge/static-index.js`), which imports the manifest from its default location (`./build/static-asset-manifest.js`) and `serverConfig` from the build config file (`./build-config.js`). Leave `assetManifestPath` at its default and export `serverConfig` from the same file. Write `serverConfig` with the full set of fields that `fastedge-init` generates; a partial `serverConfig` drops defaults such as `autoIndex`, so `/` stops serving `index.html`.

```js
const config = {
  type: 'static',
  entryPoint: '.fastedge/static-index.js',
  wasmOutput: '.fastedge/dist/fastedge.wasm',
  publicDir: './public',
  ignoreDotFiles: true,
  ignorePaths: ['/drafts'],
  ignoreWellKnown: false,
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

### BuildConfig Fields

| Field          | Type                 | Required | Description                                                        |
| -------------- | -------------------- | -------- | ------------------------------------------------------------------ |
| `type`         | `'http' \| 'static'` | Yes      | Build type; must be `http` or `static`, otherwise nothing is built |
| `entryPoint`   | `string`             | Yes      | Input JavaScript/TypeScript file                                   |
| `wasmOutput`   | `string`             | Yes      | Output WASM file path; must end in `.wasm`                         |
| `tsConfigPath` | `string`             | No       | Path to a TypeScript config file for the TypeScript check          |

`type` is optional in the TypeScript interface but required in practice.

### Static-Only Fields

When `type` is `'static'`, the following fields from `AssetCacheConfig` apply. Because `BuildConfig extends Partial<AssetCacheConfig>`, all are optional.

| Field               | Type                           | Required | Default                                    | Description                                  |
| ------------------- | ------------------------------ | -------- | ------------------------------------------ | -------------------------------------------- |
| `publicDir`         | `string`                       | No       | current directory                          | Directory containing static files to embed   |
| `assetManifestPath` | `string`                       | No       | `.fastedge/build/static-asset-manifest.js` | Output path for the generated asset manifest |
| `contentTypes`      | `Array<ContentTypeDefinition>` | No       | `[]`                                       | Custom content type mappings                 |
| `ignoreDotFiles`    | `boolean`                      | No       | `true`                                     | Skip files beginning with `.`                |
| `ignorePaths`       | `string[]`                     | No       | `[]`                                       | Paths to exclude from the manifest           |
| `ignoreWellKnown`   | `boolean`                      | No       | `false`                                    | Skip the `.well-known/` directory            |

`ignorePaths` entries are paths relative to `publicDir`. Each entry is normalized to a leading `/` and matched exactly; globs are not supported. For example, `'/drafts'` excludes `<publicDir>/drafts`.

If `assetManifestPath` does not end in `.js`, `.ts`, `.cjs`, or `.mjs`, `.js` is appended. If the resulting path is not a file path, a warning is printed and the default path is used.

The generated manifest is a JavaScript module that exports `staticAssetManifest`. It is overwritten on every build.

### ContentTypeDefinition

```typescript
interface ContentTypeDefinition {
  test: RegExp | ((assetKey: string) => boolean);
  contentType: string;
  isText: boolean;
}
```

Each rule matches asset paths using either a `RegExp` or a predicate function.

## Build Types

The `type` field selects the build behavior.

### `type: 'http'`

Runs the build pipeline on the entry point and produces a single `.wasm` component.

```js
const config = {
  type: 'http',
  entryPoint: 'src/handler.ts',
  wasmOutput: 'dist/handler.wasm',
};

export { config };
```

### `type: 'static'`

`fastedge-build` generates the asset manifest from `publicDir` itself, writes it to `assetManifestPath`, and then runs the build pipeline. The entry point must import the manifest and serve it at runtime. If you use an entry file that imports the manifest from a custom location, set `assetManifestPath` to match; the entry generated by `fastedge-init` requires the default.

If `type` is absent or does not match `'http'` or `'static'`, the CLI prints `Error: Invalid config type. Must be one of: static, http.` and nothing is built for that config; the exit code is not changed.

## Environment Variables

| Variable              | Type     | Default | Description                                                                                 |
| --------------------- | -------- | ------- | ------------------------------------------------------------------------------------------- |
| `FASTEDGE_WIZER_PATH` | `string` | unset   | Path to a wizer binary to use instead of the one from the `@bytecodealliance/wizer` package |

When `FASTEDGE_WIZER_PATH` is unset or empty, `fastedge-build` uses the binary from the `@bytecodealliance/wizer` package for the current platform. When it is set, that package is not loaded and the binary at the given path is run instead.

Set `FASTEDGE_WIZER_PATH` when building a `node_modules` directory that was installed on a different operating system. For example, a project installed on macOS and built inside a Linux container does not contain the Linux wizer package, so the default lookup fails. Point the variable at a wizer binary that runs on the build host:

```bash
FASTEDGE_WIZER_PATH=/usr/local/bin/wizer npx fastedge-build src/index.js app.wasm
```

## Output

A successful build writes a `.wasm` file to the path specified by `wasmOutput` (or `--output` in direct mode). The file is a WebAssembly Component Model component compatible with the FastEdge runtime.

In direct mode, on success the CLI prints:

```
Build success!!
"<input>" -> "<output>"
```

In config-driven mode, on success the CLI prints one line per config file:

```
Success: Built <wasmOutput>
```

### Failure Output

A failed build can leave a file at the output path. Wizer writes the requested output file before the component creation and metadata steps run, so a failure in a later step can leave a core or partially processed `.wasm` at that path. Do not treat the presence of the output file as a sign of success; check the exit code and the printed messages.

Common failure messages:

- Input is not a file: `Error: Input "<input>" is not a file`
- Output does not end in `.wasm`: `Error: Output "<output>" must be a .wasm file path`
- Input has syntax or type errors: `SyntaxError: Javascript code` or `SyntaxError: Typescript code`, followed by the checker output and `Error: "<input>" contains JS errors` or `Error: "<input>" contains Typescript errors`
- Input has an unsupported extension: `Error: "<input>" is not a valid file type - must be ".js" or ".ts"`
- TypeScript is not installed: `TypeScript is not installed.` followed by `Please run "npm install typescript"`
- Wizer fails: `Error: Failed to compile JavaScript to Wasm: Wizer initialization failure`
- Config file does not exist: `Error: Config file not found at <path>. Skipping file.`
- Config `type` missing or invalid: `Error: Invalid config type. Must be one of: static, http.`

### Exit Codes

| Mode   | Situation                                         | Exit code                                            |
| ------ | ------------------------------------------------- | ---------------------------------------------------- |
| Direct | Build succeeds                                    | `0`                                                  |
| Direct | Validation, syntax check, or Wizer failure        | `1`                                                  |
| Direct | Input or output path missing (help printed)       | `1`                                                  |
| Direct | Component creation or metadata failure            | Non-zero (error is thrown)                           |
| Config | Every config file processed                       | `0`                                                  |
| Config | Config skipped (file not found or invalid `type`) | `0` (unchanged)                                      |
| Config | Validation, syntax check, or Wizer failure        | `1` immediately; remaining configs are not processed |
| Config | Component creation or metadata failure            | Non-zero (error is thrown)                           |
| Config | Config file fails to import                       | Non-zero (error is thrown)                           |

## See Also

- [INIT_CLI.md](INIT_CLI.md) — `fastedge-init` CLI for scaffolding new projects
- [ASSETS_CLI.md](ASSETS_CLI.md) — `fastedge-assets` CLI for asset manifest management
- [STATIC_SITES.md](STATIC_SITES.md) — guide for building and serving static sites
- [SDK_API.md](SDK_API.md) — runtime API reference for handler entry points
