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
npx fastedge-build -c                    # uses default config path

# Multiple configs
npx fastedge-build -c config1.js -c config2.js

# Help and version
npx fastedge-build --help
npx fastedge-build --version
```

## Options

| Flag | Alias | Type | Description |
|------|-------|------|-------------|
| `--input` | `-i` | String | Input JavaScript/TypeScript file |
| `--output` | `-o` | String | Output WebAssembly file |
| `--tsconfig` | `-t` | String | Path to tsconfig.json |
| `--config` | `-c` | String[] | Path(s) to build config file |
| `--help` | `-h` | Boolean | Show help |
| `--version` | `-v` | Boolean | Show version |

## Build Modes

### Direct Build (HTTP Handler)

For standard HTTP event handler applications:

```bash
npx fastedge-build src/index.js output.wasm
```

This runs the full compilation pipeline:
1. **esbuild** bundles your JS/TS into a single file
2. **Regex precompilation** transforms Unicode regex for the SpiderMonkey engine
3. **Wizer** pre-initializes the StarlingMonkey runtime with your code
4. **JCO** wraps the result into a WASM Component Model binary

### Config-Driven Build

For projects using `.fastedge/build-config.js` (created by `fastedge-init`):

```bash
npx fastedge-build --config .fastedge/build-config.js
```

Config-driven builds support both `http` and `static` build types.

## Build Configuration

The config file exports a `config` object and optionally a `serverConfig`:

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
  ignoreDirs: ['./node_modules'],
  ignoreWellKnown: false,
};

const serverConfig = {
  publicDirPrefix: '',
  extendedCache: [],
  compression: [],
  notFoundPage: '/404.html',
  autoIndex: ['index.html', 'index.htm'],
};

export { config, serverConfig };
```

### BuildConfig Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'http'` \| `'static'` | No | Build type (default: http) |
| `entryPoint` | `string` | Yes | Input JavaScript/TypeScript file |
| `wasmOutput` | `string` | Yes | Output WASM file path |
| `tsConfigPath` | `string` | No | Path to tsconfig.json |

**Static-only fields** (extends `AssetCacheConfig`):

| Field | Type | Description |
|-------|------|-------------|
| `publicDir` | `string` | Directory containing static files |
| `assetManifestPath` | `string` | Output path for generated manifest |
| `ignoreDotFiles` | `boolean` | Skip dotfiles |
| `ignoreDirs` | `string[]` | Directories to exclude |
| `ignoreWellKnown` | `boolean` | Skip `.well-known/` directory |

## Output

The output `.wasm` file is a WASM Component Model binary compatible with any component model host, including the FastEdge CDN runtime (Wasmtime). It contains:

- The StarlingMonkey JavaScript engine (pre-initialized)
- Your application code (bundled and snapshot-loaded)
- WASI preview1 adapter
- Package metadata

## See Also

- [fastedge-init CLI](INIT_CLI.md) — scaffold a project with build config
- [Static Sites](STATIC_SITES.md) — static site build workflow
- [Quickstart](quickstart.md) — getting started guide
