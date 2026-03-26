# FastEdge JS SDK - Project Overview

## Purpose

The FastEdge JS SDK (`@gcoredev/fastedge-sdk-js`) enables developers to build JavaScript/TypeScript applications that compile to WebAssembly components for deployment on Gcore's FastEdge edge platform. It provides three CLI tools for the development lifecycle and a custom JavaScript runtime built on SpiderMonkey.

**npm package:** `@gcoredev/fastedge-sdk-js` v2.1.0
**Repository:** `G-Core/FastEdge-sdk-js`
**License:** Apache-2.0

## CLI Tools

| Tool | Purpose | Entry Point |
|------|---------|-------------|
| `fastedge-build` | Compile JS/TS to WASM component | `src/cli/fastedge-build/build.ts` |
| `fastedge-init` | Interactive project scaffolding wizard | `src/cli/fastedge-init/init.ts` |
| `fastedge-assets` | Static asset manifest generation | `src/cli/fastedge-assets/asset-cli.ts` |

## Architecture Overview

### Compilation Pipeline (fastedge-build)

```
JS/TS source
    → esbuild bundle (single file)
    → regex precompilation (Unicode → ASCII for SpiderMonkey)
    → Wizer pre-initialization (snapshot with fastedge-runtime.wasm)
    → JCO componentization (WASI preview1 adapter)
    → output .wasm component
```

See `context/architecture/COMPONENTIZE_PIPELINE.md` for full details.

### Runtime

The runtime is based on **StarlingMonkey** (Mozilla SpiderMonkey compiled to WASM) with custom C++ builtins providing FastEdge-specific APIs (env, kv, secret, fs, console). The runtime is defined by the `gcore:fastedge` WIT world.

See `context/architecture/RUNTIME_ARCHITECTURE.md` for full details.

### Build Types

- **`http`** — Standard HTTP event handler (`addEventListener('fetch', ...)`)
- **`static`** — Static site serving (assets embedded in WASM via manifest)

## Key Modules

| Directory | Purpose |
|-----------|---------|
| `src/cli/` | CLI entry points (3 tools) |
| `src/componentize/` | JS→WASM compilation pipeline |
| `src/server/static-assets/` | Asset manifest, loader, embedded static server |
| `src/utils/` | Shared utilities (paths, config, logging) |
| `src/constants/` | Project constants (`.fastedge` directory) |
| `runtime/fastedge/` | StarlingMonkey build + C++ builtins + host-api + WIT |
| `runtime/StarlingMonkey/` | Git submodule (SpiderMonkey-based JS engine) |
| `runtime/FastEdge-wit/` | WIT world definition (`gcore:fastedge`) |
| `types/` | TypeScript declarations (authoritative public API surface) |
| `github-pages/` | Astro documentation site (GitHub Pages) |
| `examples/` | Standalone example apps (13 examples: 6 getting-started + 7 full) |
| `config/` | Jest + ESLint configurations |
| `esbuild/` | esbuild build scripts |
| `compiler/` | Docker compiler for CI/CD |

## Package Exports

**Binaries:** `fastedge-build`, `fastedge-init`, `fastedge-assets`
**Library:** `lib/index.js` (re-exports `create-static-server.js`)
**Runtime:** `lib/fastedge-runtime.wasm`, `lib/preview1-adapter.wasm`
**Types:** `types/index.d.ts` → env, fs, kv, secret, globals

## Application Model

FastEdge apps use a Service Worker-style API:

```js
async function app(event) {
  const request = event.request;
  return new Response(`You made a request to ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
```

**Constraint:** `event.respondWith()` must be called synchronously within the event listener. The handler passed to it can be async.

## Runtime APIs (available in WASM)

| Import | API |
|--------|-----|
| `fastedge::env` | `getEnv(name)` — environment variables |
| `fastedge::kv` | `KvStore.open(name)` → get, scan, zrangeByScore, zscan, bfExists |
| `fastedge::secret` | `getSecret(name)` — deployment-time secrets |
| `fastedge::fs` | Filesystem access for embedded static assets |
| Global | `fetch`, `Request`, `Response`, `Headers`, `URL`, `crypto`, streams, timers |

## Development Setup

### Prerequisites

- Node >= 22, pnpm >= 10
- Rust + `wasm32-wasi` target
- wasi-sdk v20 (at `/opt/wasi-sdk/`)
- binaryen, cbindgen, build-essential

### First Time

```sh
git submodule update --recursive --init
pnpm install
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm run build:js` | Build CLI + libs + types (no runtime rebuild) |
| `pnpm run build:dev` | Full build including runtime (slow) |
| `pnpm run test:unit:dev` | Fast unit tests |
| `pnpm run test:unit` | Unit tests + slow tests |
| `pnpm run test:integration` | Integration tests |
| `pnpm run typecheck` | Type checking only |
| `pnpm run lint` | ESLint |

### Path Aliases (tsconfig.json)

| Alias | Maps To |
|-------|---------|
| `~componentize/*` | `src/componentize/*` |
| `~utils/*` | `src/utils/*` |
| `~static-assets/*` | `src/server/static-assets/*` |
| `~fastedge-build/*` | `src/cli/fastedge-build/*` |
| `~fastedge-init/*` | `src/cli/fastedge-init/*` |
| `~fastedge-assets/*` | `src/cli/fastedge-assets/*` |
| `~constants/*` | `src/constants/*` |

## Project Configuration

- **`.fastedge/build-config.js`** — Per-project build config (created by `fastedge-init`)
- **`tsconfig.json`** — Main TypeScript config (noEmit, path aliases)
- **`tsconfig.build.json`** — Type declaration generation
- **`tsconfig.typecheck.json`** — Type checking without emit

## Philosophy

- **WASM Component Model** — produces standard components (not core modules)
- **StarlingMonkey runtime** — SpiderMonkey-based (not V8, not QuickJS)
- **Type-safe** — TypeScript throughout, esbuild for bundling, tsc for types only
- **Service Worker API** — familiar pattern for web developers
- **Edge-first** — designed for cold-start performance via Wizer pre-initialization
