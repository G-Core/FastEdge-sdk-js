# fastedge-init CLI

Interactive scaffolding wizard that sets up a FastEdge project with build configuration.

## Usage

```bash
npx fastedge-init
```

This command runs an interactive prompt — there are no command-line flags.

## What It Does

1. Checks if a `.fastedge/build-config.js` already exists
2. Prompts: **"What are you trying to build?"**
   - **HTTP event handler** — a web application that handles HTTP requests
   - **Static website** — serve static files (HTML, CSS, JS, images) from the edge
3. Creates the `.fastedge/` directory
4. Generates configuration files based on your choice

## HTTP Event Handler Setup

When you select "HTTP event handler", `fastedge-init` creates:

```
.fastedge/
├── build-config.js    — build configuration
├── package.json       — workspace package
└── jsconfig.json      — editor support
```

### Generated `build-config.js` (HTTP)

```js
const config = {
  type: 'http',
  entryPoint: './src/index.js',
  wasmOutput: './dist/app.wasm',
};

export { config };
```

You then write your handler in `src/index.js` using the Service Worker API pattern.

## Static Website Setup

When you select "Static website", `fastedge-init` prompts for additional details:

1. **Public directory** — where your static files are (e.g., `./public`, `./dist`)
2. **Framework** — optional framework detection (CRA, Astro, etc.)

### Generated Files (Static)

```
.fastedge/
├── build-config.js    — build + server configuration
├── static-index.js    — auto-generated entry point
├── package.json       — workspace package
└── jsconfig.json      — editor support
```

### Generated `build-config.js` (Static)

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

const serverConfig = {
  extendedCache: [],
  publicDirPrefix: '',
  compression: [],
  notFoundPage: '/404.html',
  autoIndex: ['index.html', 'index.htm'],
};

export { config, serverConfig };
```

## After Scaffolding

Build your project:

```bash
npx fastedge-build --config .fastedge/build-config.js
```

The output WASM file is ready for deployment on the FastEdge platform.

## Configuration Reference

See [fastedge-build CLI](BUILD_CLI.md) for full `BuildConfig` and `ServerConfig` field definitions.

## See Also

- [fastedge-build CLI](BUILD_CLI.md) — compilation options
- [Static Sites](STATIC_SITES.md) — static site workflow
- [Quickstart](quickstart.md) — getting started guide
