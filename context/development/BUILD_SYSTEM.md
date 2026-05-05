# Build System

## Overview

The SDK uses **esbuild** for bundling and **tsc** (TypeScript compiler) for type checking and type declaration generation only. There are no Webpack or Rollup configurations.

## Build Scripts

### Full Builds

| Command | What It Does |
|---------|-------------|
| `pnpm run build:js` | Build CLI + libs + types (no runtime) — runs typecheck first, then parallel: build:cli, build:libs, build:types |
| `pnpm run build:dev` | Full build including runtime — parallel: build:js + build:monkey:dev |
| `pnpm run build:monkey:dev` | Runtime only (debug) — `runtime/fastedge/build.sh --debug` |
| `pnpm run build:monkey:prod` | Runtime only (release) — `runtime/fastedge/build.sh` |

### Individual Builds

| Command | What It Does |
|---------|-------------|
| `pnpm run build:cli` | CLI binaries only — `esbuild/cli-binaries.js` |
| `pnpm run build:libs` | Library code only — `esbuild/fastedge-libs.js` |
| `pnpm run build:types` | Type declarations only — `tsc -p tsconfig.build.json` |
| `pnpm run build:type-references` | Types + fastedge reference injection |
| `pnpm run typecheck` | Type checking without emit — `tsc -p tsconfig.typecheck.json` |

### Other

| Command | What It Does |
|---------|-------------|
| `pnpm run generate:wit-world` | Regenerate WIT bindings (merge + create) |
| `pnpm run lint` | ESLint with repo config |
| `pnpm run semantic-release` | Automated release |

## esbuild Configuration

### CLI Binaries (`esbuild/cli-binaries.js`)

Builds 3 CLI tools from TypeScript source to bundled ESM:

| Entry Point | Output |
|-------------|--------|
| `src/cli/fastedge-assets/asset-cli.ts` | `bin/fastedge-assets.js` |
| `src/cli/fastedge-build/build.ts` | `bin/fastedge-build.js` |
| `src/cli/fastedge-init/init.ts` | `bin/fastedge-init.js` |

**Settings:** `platform: "node"`, `format: "esm"`, `bundle: true`

**External packages** (not bundled — resolved at runtime):
`@bytecodealliance/wizer`, `@bytecodealliance/jco`, `esbuild`, `enquirer`, `regexpu-core`, `acorn`, `magic-string`, `acorn-walk`

After bundling, prepends `#!/usr/bin/env node` shebang to each output file.

### Library Code (`esbuild/fastedge-libs.js`)

Builds library exports:

| Entry Point | Output |
|-------------|--------|
| `src/server/static-assets/static-server/create-static-server.ts` | `lib/create-static-server.js` |

**Settings:** `format: "esm"`, `bundle: true`
**External:** `fastedge::fs` (runtime module, not a Node package)

Also generates `lib/index.js` as a re-export barrel file.

## TypeScript Configuration

### Three Configs

| Config | Purpose | Emit |
|--------|---------|------|
| `tsconfig.json` | Main config — IDE, path aliases, includes | `noEmit: true` |
| `tsconfig.build.json` | Type declaration generation | Generates `.d.ts` files |
| `tsconfig.typecheck.json` | Type checking in CI | `noEmit: true` |

### Path Aliases

Defined in `tsconfig.json` and mirrored in `config/jest/jest.config.js`:

| Alias | Maps To |
|-------|---------|
| `~componentize/*` | `src/componentize/*` |
| `~constants/*` | `src/constants/*` |
| `~fastedge-assets/*` | `src/cli/fastedge-assets/*` |
| `~fastedge-build/*` | `src/cli/fastedge-build/*` |
| `~fastedge-init/*` | `src/cli/fastedge-init/*` |
| `~static-assets/*` | `src/server/static-assets/*` |
| `~utils/*` | `src/utils/*` |

**Important:** When adding a new path alias, update both `tsconfig.json` and `config/jest/jest.config.js`.

## Customer Code Bundling (`fastedge-build`)

The `fastedge-build` CLI bundles the customer's entry file via esbuild before
componentizing it to WASM. This pipeline is intentionally independent of the
customer's `tsconfig.json`.

### What esbuild does (in `src/componentize/es-bundle.ts`)

| Setting | Value | Why |
|---------|-------|-----|
| `bundle` | `true` | Single-file output for componentize |
| `format` | `"esm"` | StarlingMonkey expects ESM |
| `target` | `"es2023"` | Matches StarlingMonkey (SpiderMonkey 140) capability |
| `tsconfig` | `undefined` | Customer tsconfig is **not** consulted by esbuild |

The bundler does not read the customer's `tsconfig.json` for `target`, `lib`,
`module`, `paths`, or anything else. The WASM output is identical regardless
of the customer's tsconfig contents.

### What the customer's `tsconfig.json` actually controls

It affects two things, both **outside** the bundle pipeline:

1. **Editor IntelliSense** — what types the customer's IDE understands.
2. **Pre-build `tsc` syntax check** — only when `--tsconfig <path>` is passed
   to `fastedge-build`, the syntax checker (`src/utils/syntax-checker.ts`)
   runs `tsc --project <path>` against the customer's source. This is a
   correctness gate, not a build step. The path is **not** forwarded to
   esbuild.

So the customer's `target`, `lib`, `module`, `moduleResolution`, `strict`,
etc. are DX choices — they have no effect on the produced WASM.

### Recommended customer `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "lib": ["ES2023"],
    "types": ["@gcoredev/fastedge-sdk-js"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

Notes:
- **No `"DOM"` in `lib`.** The SDK ships ambient declarations for every Web
  API that StarlingMonkey actually exposes (fetch, streams, crypto, encoding,
  events, abort, blob/file/formdata, timers, etc.). Including `"DOM"` would
  surface types like `document`, `window`, and `localStorage` that compile but
  throw at runtime.
- **`moduleResolution: "Bundler"`** — describes the actual customer pipeline
  (esbuild) and honors `package.json` `"exports"` correctly.
- **`target: "ES2023"`** matches the runtime; nothing transpiles below this.

## npm Package Contents

The `files` field in `package.json` controls what ships to npm:

```
types/              — TypeScript declarations
bin/*.js            — 3 CLI tools
lib/*.wasm          — fastedge-runtime.wasm + preview1-adapter.wasm
lib/*.js            — create-static-server.js + index.js
README.md
```

**Not shipped:** `src/`, `runtime/`, `config/`, `esbuild/`, `examples/`, `github-pages/`, `integration-tests/`
