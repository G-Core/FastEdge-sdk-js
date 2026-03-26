# Componentize Pipeline

## Overview

The componentize pipeline is the core of `fastedge-build`. It converts a JavaScript/TypeScript source file into a WASM Component Model binary that can run on the FastEdge edge platform.

**Entry point:** `src/componentize/componentize.ts` → `componentize(jsInput, output, opts)`
**Called by:** `src/cli/fastedge-build/config-build.ts` → `buildWasm()` / `buildFromConfig()`

## Pipeline Stages

```
                    ┌─────────────────┐
                    │  JS/TS Source    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
  Stage 1           │  esbuild Bundle │  getJsInputContents()
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
  Stage 2           │ Regex Precompile│  precompile()
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
  Stage 3           │    Wizer Init   │  spawnSync(wizer, ...)
                    │ + fastedge-     │
                    │   runtime.wasm  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
  Stage 4           │ JCO Component   │  componentNew()
                    │ + preview1      │
                    │   adapter.wasm  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Output .wasm   │
                    └─────────────────┘
```

### Stage 1: esbuild Bundling

**File:** `src/componentize/get-js-input.ts` → `getJsInputContents()`
**Bundler:** `src/componentize/es-bundle.ts` → `esBundle()`

Bundles the user's JS/TS source into a single file using esbuild. This resolves all imports and produces a self-contained script ready for WASM embedding.

- Controlled by `preBundleJSInput` option (default: `true`)
- If `false`, reads the file directly without bundling

### Stage 2: Regex Precompilation

**File:** `src/componentize/precompile.ts` → `precompile()`
**Origin:** Adapted from Fastly's `js-compute-runtime` (Apache 2.0)

**Why this exists:** SpiderMonkey inside StarlingMonkey has limited regex support. Unicode property escapes (`\p{...}`) and other advanced regex features need transformation to ASCII-compatible equivalents before the runtime can handle them.

**How it works:**
1. Parses JS source with `acorn` (AST)
2. Walks AST with `acorn-walk` finding all regex literals
3. Transforms each regex using `regexpu-core` (Unicode → ASCII)
4. Uses `magic-string` to replace regexes in-place
5. Prepends a precompilation block that exercises each regex with ASCII and UTF-8 strings — this ensures SpiderMonkey interns and compiles them during Wizer initialization rather than at request time

### Stage 3: Wizer Pre-initialization

**Tool:** `@bytecodealliance/wizer`
**Input:** `lib/fastedge-runtime.wasm` (StarlingMonkey engine) + bundled JS
**Output:** Pre-initialized core WASM module

Wizer creates a snapshot of the StarlingMonkey runtime with the user's JavaScript already loaded and executed up to the point of the `addEventListener('fetch', ...)` call. This eliminates cold-start JavaScript parsing and initialization at request time.

**Key flags:**
- `--allow-wasi` — enables WASI imports
- `--wasm-bulk-memory=true` — required for StarlingMonkey
- `--wasm-reference-types=true` — required for StarlingMonkey
- `--inherit-env=true` — passes environment to initialization
- `-r _start=wizer.resume` — entry point mapping

**Environment variables:**
- `ENABLE_PBL` — enables pre-built library mode (optional)

### Stage 4: JCO Component Composition

**Tool:** `@bytecodealliance/jco` → `componentNew()`
**Adapter:** `lib/preview1-adapter.wasm`

Wraps the Wizer output (a core WASM module) into a WASM Component Model component by attaching the WASI preview1 adapter. This makes the module compatible with any WASM Component Model host (including the FastEdge CDN's Wasmtime runtime).

After composition, `addWasmMetadata()` (`src/componentize/add-wasm-metadata.ts`) stamps the component with package metadata from `package.json`.

## Build Types

### HTTP Handler (`type: 'http'`)

Standard path: source → componentize → output.wasm

### Static Site (`type: 'static'`)

Extended path: source → `createStaticAssetsManifest()` → componentize → output.wasm

For static builds, `createStaticAssetsManifest()` (`src/server/static-assets/asset-manifest/create-manifest.ts`) scans the project's static files, inlines them into a manifest, and generates an entry point that serves them using `create-static-server.ts`.

## Configuration

### CLI Arguments (`fastedge-build`)

```
fastedge-build <input> <output>              # Direct mode
fastedge-build --input <file> --output <file> # Named options
fastedge-build --config <path>               # Config-driven
fastedge-build -c                            # Default config (.fastedge/build-config.js)
```

### BuildConfig Interface

```typescript
// src/cli/fastedge-build/types.ts
interface BuildConfig extends Partial<AssetCacheConfig> {
  type?: 'static' | 'http';
  entryPoint: string;
  wasmOutput: string;
  tsConfigPath?: string;
}
```

### ComponentizeOptions

```typescript
// src/componentize/componentize.ts
interface ComponentizeOptions {
  debug?: boolean;
  wasmEngine?: string;        // default: lib/fastedge-runtime.wasm
  enableStdout?: boolean;
  enablePBL?: boolean;         // pre-built library mode
  preBundleJSInput?: boolean;  // default: true
}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/componentize/componentize.ts` | Main pipeline orchestrator |
| `src/componentize/get-js-input.ts` | Stage 1: esbuild bundling |
| `src/componentize/es-bundle.ts` | esbuild configuration for user code |
| `src/componentize/precompile.ts` | Stage 2: regex precompilation |
| `src/componentize/add-wasm-metadata.ts` | Post-Stage 4: metadata stamping |
| `src/cli/fastedge-build/build.ts` | CLI entry point (arg parsing) |
| `src/cli/fastedge-build/config-build.ts` | Config-driven build orchestration |
| `src/cli/fastedge-build/types.ts` | BuildConfig type definition |
| `lib/fastedge-runtime.wasm` | StarlingMonkey engine (built artifact) |
| `lib/preview1-adapter.wasm` | WASI preview1 adapter (built artifact) |

## Testing

- **Unit tests:** `src/componentize/__tests__/` — tests for add-wasm-metadata, componentize, get-js-input
- **Integration tests:** `integration-tests/` — tests full CLI build output (fastedge-build.test.js, generates-output.test.js)
