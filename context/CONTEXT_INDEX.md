# Context Discovery Index

## Quick Start

- **Project:** FastEdge JS SDK + CLI toolchain
- **Package:** `@gcoredev/fastedge-sdk-js` v2.1.0
- **Purpose:** Compile JS/TS apps into WASM components for Gcore FastEdge edge platform
- **CLIs:** `fastedge-build` (compiler), `fastedge-init` (scaffolder), `fastedge-assets` (static manifests)
- **Runtime:** StarlingMonkey (SpiderMonkey → WASM) with custom C++ builtins
- **WIT World:** `gcore:fastedge/reactor` — imports http, dictionary, secret, key-value; exports http-handler
- **Build:** esbuild + Wizer + JCO → WASM Component Model
- **Tests:** Jest (unit in `src/**/__tests__/`, integration in `integration-tests/`)
- **Node:** >= 22, pnpm >= 10

---

## Documentation Map

### Architecture (read when modifying internal structure)

| Document | Lines | Purpose |
|----------|-------|---------|
| `architecture/COMPONENTIZE_PIPELINE.md` | ~160 | The 4-stage JS→WASM compilation chain (esbuild → regex precompile → Wizer → JCO). Read when working on `fastedge-build` or `src/componentize/`. |
| `architecture/RUNTIME_ARCHITECTURE.md` | ~170 | StarlingMonkey runtime, C++ builtins (env, kv, secret, fs, console), host-api bridge, WIT definitions, build process. Read when working on `runtime/`. |

### Development (read when implementing or testing)

| Document | Lines | Purpose |
|----------|-------|---------|
| `development/BUILD_SYSTEM.md` | ~110 | esbuild scripts, TypeScript config (3 tsconfigs), path aliases, npm package contents. Read when changing build configuration. |
| `development/TESTING_GUIDE.md` | ~90 | Jest setup, unit vs integration tests, test organization, running tests. Read when adding or modifying tests. |

### Reference (search on-demand)

| Document | Lines | Purpose |
|----------|-------|---------|
| `PROJECT_OVERVIEW.md` | ~150 | Lightweight project overview — architecture, key modules, dev setup, common commands. Read when new to the codebase. |
| `CHANGELOG.md` | ~25+ | Change history. Use grep, don't read linearly as this file grows. |

### External (not in context/)

| Resource | Location | Purpose |
|----------|----------|---------|
| TypeScript declarations | `types/` | Authoritative public API surface (env, fs, kv, secret, globals) |
| GitHub Pages docs | `github-pages/` | Astro-based user-facing documentation site |
| Pipeline docs | `docs/` (planned) | Human-facing docs feeding into fastedge-plugin |
| Examples | `examples/` | 13 standalone example apps showing real patterns |

---

## Decision Tree: What Should I Read?

### Adding a CLI Feature (flag, option, subcommand)
1. Read `development/BUILD_SYSTEM.md` (CLI build section)
2. Read the relevant CLI entry point: `src/cli/fastedge-{build,init,assets}/`
3. Grep `CHANGELOG.md` for similar past changes

### Fixing a Componentize Bug
1. Read `architecture/COMPONENTIZE_PIPELINE.md`
2. Read the specific pipeline stage file (see Key Files table in that doc)
3. Run `pnpm run test:unit:dev` to verify

### Adding a Runtime Host API
1. Read `architecture/RUNTIME_ARCHITECTURE.md` (builtins + host-api + WIT sections)
2. Read existing builtin as template: `runtime/fastedge/builtins/fastedge.cpp`
3. Update WIT: `runtime/FastEdge-wit/` + `runtime/fastedge/host-api/wit/`
4. Run `pnpm run generate:wit-world`

### Modifying Static Assets System
1. Read `architecture/COMPONENTIZE_PIPELINE.md` (Build Types section)
2. Read `src/server/static-assets/` source files
3. Check tests in `src/server/static-assets/**/__tests__/`

### Updating Type Definitions
1. Read `types/` directory (authoritative API surface)
2. Check `github-pages/src/content/docs/reference/` for user-facing docs
3. Run `pnpm run build:types` to verify

### Adding or Editing an Example
1. Browse `examples/` for an existing example similar to your target
2. Each example is standalone with its own `package.json`
3. Install SDK via `npm install --save-dev @gcoredev/fastedge-sdk-js`
4. **Every example MUST have its own `README.md`** explaining what it does
5. **Every example MUST have an entry in `examples/README.md`** (the top-level index)
6. **Terminology**: In READMEs, always refer to "environment variables" — never "dictionary variables". `dictionary` is the internal package name for accessing environment variables, not a user-facing concept

### Changing the Build System
1. Read `development/BUILD_SYSTEM.md`
2. Check `esbuild/cli-binaries.js` and `esbuild/fastedge-libs.js`
3. Verify path aliases match in `tsconfig.json` and `config/jest/jest.config.js`

### Working with WIT Definitions
1. Read `architecture/RUNTIME_ARCHITECTURE.md` (WIT section)
2. Read `runtime/FastEdge-wit/world.wit` (top-level world)
3. Read `runtime/fastedge/host-api/wit/` (local bindings)
4. Run `pnpm run generate:wit-world` after changes

### Writing Tests
1. Read `development/TESTING_GUIDE.md`
2. Follow co-located pattern: `__tests__/` next to source
3. Integration tests go in `integration-tests/`

### Understanding the System (new to codebase)
1. Read `PROJECT_OVERVIEW.md` (~150 lines)
2. Skim `architecture/COMPONENTIZE_PIPELINE.md` (pipeline diagram)
3. Browse `examples/` for usage patterns

### Modifying esbuild Configuration
1. Read `development/BUILD_SYSTEM.md` (esbuild sections)
2. Read `esbuild/cli-binaries.js` or `esbuild/fastedge-libs.js`
3. Check external packages list — adding/removing externals affects bundle size

### Working on fastedge-init Scaffolder
1. Read `src/cli/fastedge-init/` source files
2. Read `PROJECT_OVERVIEW.md` (Build Types section)
3. Check `integration-tests/` for CLI tests

### Updating the Docs Site (GitHub Pages)
1. The Astro site is in `github-pages/` (separate pnpm workspace)
2. Code examples in the docs are imported from `examples/` via a Vite alias (`@examples` → `../examples/`). Edit the source in `examples/<name>/src/index.js` — the docs site picks it up automatically.
3. Changes to `github-pages/**` trigger the docs deploy workflow
4. Run `cd github-pages && pnpm build` to verify locally

---

## Search Tips

- **Don't** read `CHANGELOG.md` linearly — grep for keywords
- **Grep patterns:**
  - `grep -r "componentize" src/` — find pipeline references
  - `grep -r "INIT_ONLY" runtime/` — find initialization-only APIs
  - `grep -r "add_builtin" runtime/` — find registered builtins
  - `grep -r "external:" esbuild/` — find externalized packages
- **File discovery:** `find src/ -name "*.test.ts"` to locate tests

## Documentation Size Reference

| Category | Documents | Total Lines |
|----------|-----------|-------------|
| Architecture | 2 docs | ~330 |
| Development | 2 docs | ~200 |
| Reference | 2 docs | ~175 |
| **Total** | **6 docs** | **~700** |

All documents are designed for single-sitting reads. No doc exceeds 170 lines.
