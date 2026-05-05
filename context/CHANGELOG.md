# Changelog

Track significant changes to the FastEdge JS SDK codebase.
When this file grows large, use grep to search — don't read linearly.

---

## [2026-05-05] — Customer tsconfig modernisation + globals.d.ts audit

### Overview
Brought the recommended customer `tsconfig.json` in line with what StarlingMonkey actually supports (ES2023, no DOM lib) and expanded `types/globals.d.ts` to declare every Web API the runtime exposes. Made the customer-bundle esbuild target explicit. Removed dead Fastly-inherited type declarations that had no runtime backing.

### Changes
- **`types/globals.d.ts`** — verified each addition against `runtime/StarlingMonkey/builtins/web/` C++ sources:
  - Added: `TextEncoder`, `TextDecoder`, `Event`, `CustomEvent`, full `EventTarget`, `AbortController`, `AbortSignal`, `Blob`, `File`, `FormData` and their init/option dictionaries.
  - Uncommented (now backed by runtime): `Body.blob()`, `Body.formData()`, `RequestInit.signal`, `Request.signal`, `Response.redirected`, `Response.type`. Added `ResponseType`.
  - Added: `Headers.getSetCookie()`.
  - Updated: `BodyInit` to include `Blob | FormData`.
  - **Removed** (no implementation in either StarlingMonkey or `runtime/fastedge/builtins/`): `Request.setCacheKey`, `Request.setManualFramingHeaders`, `Response.setManualFramingHeaders`, and the corresponding `manualFramingHeaders` flags on `RequestInit`/`ResponseInit`. These were inherited from a Fastly types copy and threw `TypeError` at runtime.
  - Confirmed staying commented out (not parsed by `request-response.cpp`): `cache`, `credentials`, `redirect`, `mode`, `integrity`, `keepalive`, `referrer`, `referrerPolicy`, `window`, `Response.clone()`, `Response.error()`.
- **`tsconfig.json`** — bumped SDK root `target` to `ES2023`.
- **`src/componentize/es-bundle.ts`** — set explicit `format: "esm"` and `target: "es2023"` on the customer-bundle esbuild call so the contract is documented in code rather than implicit-via-default.
- **`src/cli/fastedge-init/create-config.ts`** — bumped scaffolded `.fastedge/jsconfig.json` `target` from `ES6` to `ES2023`.
- **Examples** — updated `cache/`, `kv-store/`, `static-assets/`, `mcp-server/`, and `react-with-hono-server/tsconfig.fastedge.json` to the new recommended config: `ES2023` target/lib, `moduleResolution: "Bundler"` (except `mcp-server` which keeps `Node16` because it `tsc`-emits before `fastedge-build`), no `DOM` lib. The Vite-side configs (`tsconfig.app.json`, `tsconfig.node.json`) in `react-with-hono-server` are untouched — they target the browser/Node tooling, not the FastEdge worker.
- **`context/development/BUILD_SYSTEM.md`** — new "Customer Code Bundling" section documenting that the customer's `tsconfig.json` does **not** influence WASM output (esbuild ignores it), the actual scope of `--tsconfig` (drives `tsc --project` syntax check only), and the recommended customer config.

### Migration / impact
- **No runtime behaviour change.** ES2023 target on esbuild is now explicit; previously it inherited esbuild's `esnext` default which already preserved modern syntax for SpiderMonkey 140 to execute.
- **`Request.setCacheKey()` / `setManualFramingHeaders()` removed from types.** Anyone calling these at runtime was already getting a `TypeError`; the type removal stops it compiling silently.
- **DOM lib no longer needed.** Customer code that relied on `document`/`window`/`localStorage` types was already broken at runtime; this change makes it broken at compile time, which is the right outcome.
- **Verification:** `pnpm run typecheck`, `pnpm run build:types`, `pnpm run test:unit:dev` (425 tests pass), `pnpm run build` in `examples/cache-basic` all pass. Each updated example tsconfig typechecks cleanly against the new globals.

---

## [2026-05-04] — KvStoreEntry: entry-style accessors for KV Store

### Overview
Added an entry-shaped read API to `fastedge::kv` mirroring the `CacheEntry` shape from `fastedge::cache`. Three new methods on `KvStoreInstance` (`getEntry`, `zrangeByScoreEntries`, `zscanEntries`) return `KvStoreEntry` wrappers exposing `arrayBuffer()`, `text()`, and `json()` Promise-returning accessors. The existing `get` / `zrangeByScore` / `zscan` methods are unchanged and remain fully supported.

### Changes
- **`runtime/fastedge/builtins/kv-store.{h,cpp}`** — added `KvStoreEntry` class (anonymous-namespace, mirrors `CacheEntry` from `cache.cpp`) and three new `KvStore` methods (`get_entry`, `zrange_by_score_entries`, `zscan_entries`) registered as `getEntry`, `zrangeByScoreEntries`, `zscanEntries` on the JS instance prototype. No WIT changes — the new methods reuse the existing `kv_store_get` / `kv_store_zrange_by_score` / `kv_store_zscan` host functions.
- **`types/fastedge-kv.d.ts`** — added `KvStoreEntry` interface and three new method signatures. Existing methods cross-referenced via `@see` tags pointing to their entry-style counterparts. Top-of-file example updated to use `getEntry().text()`.
- **`examples/kv-store-basic/src/index.js`** — switched to `getEntry().text()` (the previous template-literal interpolation of an `ArrayBuffer` rendered as `[object ArrayBuffer]` rather than the stored value).
- **`github-pages/src/content/docs/reference/fastedge/kv/key-value.md`** and **`zset.md`** — added documentation for `getEntry`, `zrangeByScoreEntries`, and `zscanEntries`; fixed the buggy template-literal example in the `get` section. Language is neutral — neither form is presented as preferred.

### Migration
- **No breaking changes.** Code using `get` / `zrangeByScore` / `zscan` continues to work indefinitely; the entry-style methods are additive and recommended for new code.
- The entry methods are Promise-returning (matching `Cache`); the legacy methods remain synchronous.

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
