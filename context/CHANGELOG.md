# Changelog

Track significant changes to the FastEdge JS SDK codebase.
When this file grows large, use grep to search — don't read linearly.

---

## [2026-04-30] — Cache API examples + workspace SDK override

### Overview
Added two new examples covering the `fastedge::cache` API and introduced a workspace-level pnpm override so example builds resolve the in-tree SDK during development without changing the public dependency pin.

### Changes
- **`examples/cache-basic/`** — minimal getting-started example. Single JS file (`src/index.js`) with action-based routing covering `Cache.set` / `get` / `exists` / `delete`. Heavy explanatory comments throughout for users learning the platform. Registered under "Getting Started Examples" in `examples/README.md`.
- **`examples/cache/`** — flagship full example. TypeScript with three patterns: per-IP rate limiting via atomic `incr` + `expire` (uses `event.client.address`), origin-cache proxy via `getOrSet` with a `fetch` populator, and JSON memoisation via `getOrSet` with a synchronous populator. Registered under "Full Examples".
- **`pnpm-workspace.yaml`** — added `overrides: { '@gcoredev/fastedge-sdk-js': 'link:.' }`. Inside the workspace, all examples now symlink to the root SDK package; outside the workspace (copy-pasted examples), the override is invisible and `pnpm install` resolves the published artefact from npm as users expect.
- **Verification:** both examples build cleanly via `pnpm run build`; `wasm-tools component wit` confirms the produced wasm imports `gcore:fastedge/cache-types` and `gcore:fastedge/cache-sync`, proving the cache resolution case in `src/componentize/es-bundle.ts:38-44` is wired through end-to-end.
- **Pin:** examples use `@gcoredev/fastedge-sdk-js@^2.2.3`, anticipating the next published release that will include cache support. Until that release ships, builds inside the workspace use the symlinked SDK; outside the workspace they would warn ("fastedge:cache has no exports") since the published 2.2.2 predates this branch.

---

## [2026-04-08] — ESLint 10 Migration + Dependency Upgrades

### Overview
Migrated ESLint from v8 (legacy `.eslintrc.cjs`) to v10 (flat config `eslint.config.js`). Upgraded the full ESLint plugin ecosystem, Jest to v30, and other tooling. Resolved CVE-2026-26996 (minimatch ReDoS vulnerability). Fixed pre-existing `fastedge-build` integration test failures caused by TypeScript `moduleResolution: node` deprecation.

### Changes
- **ESLint 8 → 10:** Converted config from `.eslintrc.cjs` to `eslint.config.js` (flat config, ESM). Kept modular rule file structure (7 files in `config/eslint/repo/rules/`), converted all from CJS to ESM.
- **Package replacements:** `@typescript-eslint/eslint-plugin` v7 → `typescript-eslint` v8 (unified package); `eslint-plugin-import` → `eslint-plugin-import-x` (all rules renamed `import/` → `import-x/`); `eslint-plugin-ban` → native `no-restricted-syntax` AST selector
- **Removed unused deps:** `eslint-config-standard`, `eslint-plugin-n`, `eslint-plugin-only-warn`, `eslint-plugin-promise`, `ts-jest` (project uses `babel-jest`)
- **New deps:** `@stylistic/eslint-plugin` (formatting rules removed from ESLint core), `globals` (flat config environment globals)
- **Rule migrations:** ~62 formatting rules → `@stylistic/` prefix; `no-new-symbol` → `no-new-native-nonconstructor`; `no-new-object` → `no-object-constructor`; `no-return-await` → disabled (requires typed linting); `unicorn/no-array-push-push` → `unicorn/prefer-single-call`
- **Jest 29 → 30:** Upgraded `jest`, `babel-jest`, `@jest/transform`, `@types/jest`. Fixed `jest.SpyInstance` → `jest.Spied` (3 test files). Resolved existing `@jest/globals` v30 / `jest` v29 version mismatch.
- **Other upgrades:** `esbuild` 0.27 → 0.28, `globals` 16 → 17, `@stylistic/eslint-plugin` 4 → 5, `eslint-plugin-jest` 28 → 29, `eslint-plugin-unicorn` 58 → 64
- **Stale eslint-disable comments:** Updated `import/` → `import-x/`, `@typescript-eslint/no-var-requires` → `@typescript-eslint/no-require-imports`, `quote-props` → `@stylistic/quote-props`, removed obsolete directives
- **Syntax checker fix:** Added `--ignoreDeprecations` flag (version-aware: `5.0` for TS 5.x, `6.0` for TS 6.x) to suppress `moduleResolution: node` deprecation warning. See CONTEXT_INDEX.md "Known Issues" for the long-term fix needed before TS 7.
- **CVE-2026-26996 resolved:** `minimatch` 9.0.5 eliminated from dependency tree by upgrading from `@typescript-eslint` v7 to `typescript-eslint` v8

---

## [2026-03-31] — Examples and Terminology Conventions

### Overview
Documented conventions for example maintenance and user-facing terminology.

### Decisions
- Every example must have its own `README.md` and an entry in the top-level `examples/README.md` index
- In all user-facing documentation (READMEs, docs), always use "environment variables" — never "dictionary variables". The `dictionary` package is an internal implementation detail for accessing environment variables on the platform, not a user-facing concept

---

## [2026-03-26] — Examples Consolidation

### Overview
Moved 6 code snippets from `github-pages/examples/` into `examples/` as standalone projects, eliminating duplication. The Astro docs site now imports example code from the main `examples/` folder via a Vite alias.

### Changes
- Created 6 new standalone examples: `hello-world`, `downstream-fetch`, `downstream-modify-response`, `headers`, `kv-store-basic`, `variables-and-secrets`
- Added Vite resolve alias `@examples` → `../examples/` in `github-pages/astro.config.mjs`
- Updated all 6 MDX files to import from `@examples/<folder>/src/index.js?raw`
- Renamed `basic.mdx` → `hello-world.mdx`
- Reorganized `examples/README.md` into "Getting Started" and "Full Examples" sections
- Deleted `github-pages/examples/` (no longer needed)

---

## [2026-03-25] — Agent Context Setup

### Overview
Added CLAUDE.md and context/ folder for agent discoverability. Renamed `docs/` to `github-pages/` per company-wide convention to make room for pipeline-compatible documentation.

### Changes
- Renamed `docs/` → `github-pages/` (Astro GitHub Pages site)
- Updated references in `tsconfig.json`, `pnpm-workspace.yaml`, `.github/workflows/docs.yaml`, `config/jest/jest.config.js`
- Created `context/` folder with discovery-based navigation system:
  - `PROJECT_OVERVIEW.md` — lightweight project overview
  - `architecture/COMPONENTIZE_PIPELINE.md` — JS→WASM compilation pipeline
  - `architecture/RUNTIME_ARCHITECTURE.md` — StarlingMonkey, builtins, WIT
  - `development/BUILD_SYSTEM.md` — esbuild, TypeScript, path aliases
  - `development/TESTING_GUIDE.md` — Jest setup, test organization
  - `CONTEXT_INDEX.md` — discovery hub
  - `CHANGELOG.md` — this file
- Created `CLAUDE.md` — agent onboarding instructions
