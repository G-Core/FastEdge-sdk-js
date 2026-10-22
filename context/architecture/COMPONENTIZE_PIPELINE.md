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

The SDK uses `esbuild-wasm`, not native `esbuild`, so bundling has no per-platform binary (see Platform-neutral build below).

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

**Tool:** `@bytecodealliance/wizer`, or the binary named by `FASTEDGE_WIZER_PATH` when set
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

**Tool:** `@bytecodealliance/jco-transpile/wasm-tools` → `componentNew()`
**Adapter:** `lib/preview1-adapter.wasm`

Wraps the Wizer output (a core WASM module) into a WASM Component Model component by attaching the WASI preview1 adapter. This makes the module compatible with any WASM Component Model host (including the FastEdge CDN's Wasmtime runtime).

After composition, `addWasmMetadata()` (`src/componentize/add-wasm-metadata.ts`) stamps the component with package metadata from `package.json`.

## Component imports (splice flow)

**File:** `src/componentize/components.ts` (called from `componentize()` when `components` is non-empty)

Lets an app import any Wasm component by WIT interface (`import { scanUrl } from 'regexped:urlguard/sets'`). Configured as `components: { '<ns:pkg/iface>': '<path>' }` in the build config, or `--component <iface>=<path>` (repeatable). The plain flow above is unchanged when no components are given.

1. **Types** (`writeComponentTypes`, from `buildWasm()` before the syntax check): reads each component, builds a WIT world importing the interfaces, writes `fastedge-components.d.ts` next to the entry point via jco-transpile's guest typegen (`@bytecodealliance/jco-transpile/component`).
2. **Bundle:** esbuild marks the interface names `external`, so the `import`s survive; `precompile()` parses as `sourceType: 'module'`.
3. **Splice** (`spliceImports`): the ComponentizeJS splicer patches the engine's `coreabi_*` hooks (the `embedding` builtin) with lowering/lifting for the user world only, and returns JS glue. A warm-up is appended to the glue so it runs at Wizer time: it touches the standard classes the glue uses (typed arrays, DataView, String, BigInt, Error), which SpiderMonkey otherwise sets up in the glue's global on first use in every request (~160 µs on the first import call, ~150 µs more on the first string argument). Measurements and how to diagnose a slow component: `development/COMPONENT_PERFORMANCE.md`.
4. **Wizer** runs `--init-func componentize.wizer` on the spliced engine (instead of `-r _start=wizer.resume`), with `SOURCE_NAME`/`IMPORT*`/`EXPORT_CNT` env and the initializer/source paths on stdin, quoted (StarlingMonkey splits stdin on whitespace).
5. **Restore bindings** (`restoreEngineBindings`): the splicer replaces the engine's `component-type:bindings` custom section with one for the user world, which would drop the FastEdge imports and the http handler export. The engine's original section is appended back; `componentNew` merges both.
6. **componentNew** as in Stage 4.
7. **Compose + validate** (`composeComponents`): `wac plug` satisfies the imports with the components, then every remaining import must be `wasi:*@0.2.*` or `gcore:*` (what the FastEdge host links). A failure removes the output file.

FastEdge host APIs stay C++ builtins; splicing is only for third-party components whose WIT isn't known when the engine is built.

**Vendored tools:** `vendor/splicer/` (ComponentizeJS splicer) and `vendor/component-tools/` (our wac-graph / wit-component wrapper), both jco-transpiled wasm on `@bytecodealliance/preview2-shim`, so the build stays platform-neutral. What they are, version coupling, when and how to update them, licensing and CI coverage: `development/VENDORED_TOOLS.md`.

## Platform-neutral build

`fastedge-build` must work from a `node_modules` installed on a different OS, e.g. a project installed on macOS and built in the FastEdge MCP server's Linux container. Only wizer is a native binary:

- Bundling uses `esbuild-wasm`. Native `esbuild` needs a binary whose version exactly matches the JS package, so a build host can't supply one.
- `componentNew()` and `metadataAdd()` come from `@bytecodealliance/jco-transpile/wasm-tools`, which is wasm. The `@bytecodealliance/jco` root entry loads native napi modules (oxc-minify, rolldown, jco-node-fs) at import time even though the build never calls them.
- `@bytecodealliance/wizer` is imported lazily, only when `FASTEDGE_WIZER_PATH` is unset, because the package throws at load time when this platform's binary is missing.

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
fastedge-build -i <in> -o <out> --component <iface>=<path>  # Component import (repeatable)
```

### BuildConfig Interface

```typescript
// src/cli/fastedge-build/types.ts
interface BuildConfig extends Partial<AssetCacheConfig> {
  type?: 'static' | 'http';
  entryPoint: string;
  wasmOutput: string;
  tsConfigPath?: string;
  components?: Record<string, string>; // WIT interface → component path (cwd-relative)
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
  components?: Record<string, string>; // enables the splice flow
}
```

## Key Files

| File | Purpose |
|------|---------|
| `src/componentize/componentize.ts` | Main pipeline orchestrator |
| `src/componentize/get-js-input.ts` | Stage 1: esbuild bundling |
| `src/componentize/es-bundle.ts` | esbuild configuration for user code |
| `src/componentize/precompile.ts` | Stage 2: regex precompilation |
| `src/componentize/components.ts` | Component imports: types, splice, bindings restore, compose + validate |
| `src/componentize/add-wasm-metadata.ts` | Post-Stage 4: metadata stamping |
| `src/cli/fastedge-build/build.ts` | CLI entry point (arg parsing) |
| `src/cli/fastedge-build/config-build.ts` | Config-driven build orchestration |
| `src/cli/fastedge-build/types.ts` | BuildConfig type definition |
| `lib/fastedge-runtime.wasm` | StarlingMonkey engine (built artifact) |
| `lib/preview1-adapter.wasm` | WASI preview1 adapter (built artifact) |

## Testing

- **Unit tests:** `src/componentize/__tests__/` — tests for add-wasm-metadata, componentize, components, get-js-input
- **Integration tests:** `integration-tests/` — tests full CLI build output (fastedge-build.test.js, generates-output.test.js); `component-imports.test.js` runs real splice-flow builds against stub components generated by `test-files/components/make-components.mjs`; `cross-platform-build.test.js` builds and runs an app against the real `test-files/components/calculator.wasm`
- **Runtime check:** `examples/component-imports/` fixtures (regexped URL guard) — run them under `@gcoredev/fastedge-test`
