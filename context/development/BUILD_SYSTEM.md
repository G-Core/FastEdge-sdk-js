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
