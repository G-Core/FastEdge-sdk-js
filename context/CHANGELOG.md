# Changelog

Track significant changes to the FastEdge JS SDK codebase.
When this file grows large, use grep to search — don't read linearly.

---

## [2026-10-27] — POC: `fastedge::db/sql` (gcore:db/sql@0.1.0)

### Overview
Spike of the SQL database binding: apps query a customer-owned Postgres (Neon) by binding name; the host holds the credentials.

### Changes
- `runtime/FastEdge-wit` → FastEdge-wit `feat/db-interface` (`gcore:db/sql@0.1.0` in `deps/db`)
- `merge-wit-bindings.js`: hoists FastEdge-wit `deps/*` to `wit/deps/` so wit-bindgen resolves them
- New builtin `builtins/db-sql.{h,cpp}`: globals `SqlDatabase` (`open`, `query`, `batch` -> Promises; sync host calls) and `SqlError` (real `Error`, `kind`/`code`/`detail`/`hint`/`constraint`); type mapping (int8 -> string, json parsed, bytea -> Uint8Array) and `rowMode: 'array'` in C++
- `es-bundle.ts`: `fastedge::db/sql` re-exports `SqlDatabase` and `SqlError` (same pattern as `fastedge::kv`)
- `types/fastedge-db-sql.d.ts` (`SqlDatabase`, `SqlError`, `SqlResult<T>`, `SqlParam`, `SqlValue`), referenced from `types/index.d.ts`
- `examples/db-sql`: Drizzle over `fastedge::db/sql` + drizzle-kit migrations (`drizzle/0000_init`, `0001_seed`); same table, data and responses as sdk-rust `examples/http/wasi/db_sql`
- **Release order:** every app built with this SDK imports `gcore:db/sql@0.1.0`, so hosts without it fail with `530 fastedge: context error` (incl. the `fastedge-run` bundled in `@gcoredev/fastedge-test`; `cross-platform-build.test.js` component-import runtime tests fail until it is updated). Release only after the engine ships `gcore:db/sql` everywhere.
- No docs/tests yet (spike). Drizzle works via `drizzle-orm/pg-proxy` (see coordinator `db-integration/`)

---

## [2026-10-27] — StarlingMonkey v0.4.0 (no fork) + wit-bindgen 0.52.0

### Overview
Submodule moved from our fork (`godronus/gcore/integration`, 0.3.0 + 4 patches) to vanilla upstream `starlingmonkey-v0.4.0`; host-api bindings regenerated with wit-bindgen 0.52.0 (was pinned to 0.30.0).

### Changes
- `runtime/StarlingMonkey` → `starlingmonkey-v0.4.0` (`d7283bb`). All 4 fork patches are upstream (Response.clone #312, Blob.type #313, WPT baseline superseded); verified line-by-line. v0.4.0 also brings crypto fixes (HMAC use-after-free, Ed25519, key usages), URL / form-data / console fixes, FinalizationRegistry cleanup.
- `runtime/fastedge/host-api/bindings/*` regenerated with wit-bindgen 0.52.0 (same version StarlingMonkey uses for its default wasi-0.2.10 host API, compiled against the same `wasi-0.2.0/host_api.cpp`). WASI stays 0.2.3. The 0.37.0 unaligned-offset regression is absent (offsets via `sizeof(void*)`).
- `context/PATCHES.md`: no patches; former fork commits mapped to upstream PRs. Response.clone test guard removal marked due after edge validation.
- `context/development/BUILD_SYSTEM.md`: required wit-bindgen is now 0.52.0; 0.30/0.37 history kept.

### Verification
- Runtime builds (9.9 MB, was 10.6 MB). Unit 458/458, integration 88/88.
- Test app under local `fastedge-run` (wasmtime 48): echo, env, outbound fetch, secret pass; Response.clone tests 1-6, 8, 9 pass in isolation. Tests 7-8 of the guard self-fetch the app's own origin, which `fastedge-run` can't serve locally (NetworkError), so the full guard only runs on a deployed app.
- Preprod edge (2026-10-27, test app deployed as `sdk-js-sm040-test-app`): echo, env, outbound fetch, secret pass; Response.clone tests 1-9 all correct (incl. 128 KiB multi-chunk self-fetch). On the Free plan the Response.clone handler sometimes hits the execution budget (`3010`); the same app on the published 2.7.0 runtime does too (old 12/20 vs new 15/20 completed), so not a regression.
- Response.clone test kept as a permanent regression test (no longer a patch guard).

---

## [2026-10-21] — fastedge-build: import Wasm components by WIT interface

### Overview
Apps can `import { fn } from 'ns:pkg/iface'` and have `fastedge-build` compose the component that exports it into the output. Builds without components are unchanged.

### Changes
- **Config / CLI:** `components: { '<ns:pkg/iface>': '<path>' }` in the build config; `--component <iface>=<path>` (repeatable) with `-i`/`-o`.
- **Pipeline** (`src/componentize/components.ts`): interface WIT read from the components → `fastedge-components.d.ts` next to the entry point (before the tsc syntax check) → esbuild keeps the imports external → precompile parses as a module → ComponentizeJS splicer (user world only) + Wizer-time warm-up of the glue's standard classes → Wizer `componentize.wizer` → engine's `component-type:bindings` section restored → `componentNew` → `wac plug` → imports must be `wasi:*@0.2.*` or `gcore:*`. Bad interface names, missing or non-component files, unexported interfaces and unsupported imports fail with a clear error and no output file.
- **Vendored, platform-neutral:** `vendor/splicer/` (ComponentizeJS 0.23.0, `tools/splicer/vendor.sh`) and `vendor/component-tools/` (new Rust crate in `tools/component-tools/` — wac-graph plug, WIT world builder, import lister — jco-transpiled). Shipped in the npm package (3.5 → 5.5 MB packed) with `LICENSE` files and a `cargo about`-generated `THIRD_PARTY_LICENSES.txt` for component-tools; new dependency `@bytecodealliance/preview2-shim`. Maintenance (coupling, when/how to update, CI coverage): `context/development/VENDORED_TOOLS.md`.
- `precompile()` takes an optional `sourceType`; `esBundle()` / `getJsInputContents()` take an `external` list.
- **Example:** `examples/component-imports/` — image thumbnails: a Rust component (`image` crate, JPEG+PNG; source in `component/`, committed `thumbnail.wasm`) exporting `example:image/thumbnail` (`dimensions`, `resize`), called from TypeScript; images embedded as static assets; rejects images over 0.5 MP before decoding to stay within the free plan's 100 ms / 52 MB. Measured on the edge: 612×640 JPEG thumbnail in ~20–30 ms, 3 MB.
- **Tests:** unit `components.test.ts` + splice case in `componentize.test.ts`; integration `component-imports.test.js` (stub components generated at test time); cross-platform (Ubuntu, Windows, macOS) builds a TypeScript app against the committed `test-files/components/calculator.wasm` (Rust source alongside; two interfaces from one file; s32, f64, `result`, `list<f64>`, record, string, resource) with native modules blocked from paths with spaces, checks the declarations and that `tsc` rejects a mistyped call, then runs the composed app under `@gcoredev/fastedge-test` (new devDependency). A second committed component, `fetcher.wasm`, makes its own outgoing HTTP request through the host to a local server. `deploy.yaml` now also triggers on `vendor/**`.
- **TypeScript without a tsconfig:** the default `tsc` flags now include `fastedge-components.d.ts` when it sits next to the entry, so component imports resolve (found by the calculator test).
- **Stale declarations:** a build without components deletes a `fastedge-components.d.ts` next to the entry if it carries our generated header, so imports of removed components fail the type check instead of esbuild; a file without the header is left alone.
- **Two component files:** every decoded component's own package is `root:component`, so merging a second file failed (`failed to merge package root:component`); `component-tools` now gives each an unused name before merging, and leaves the components' own packages out of the printed WIT by ID (not by name, so a real `root:*` dependency is kept). Covered by an integration test with two files.
- **Declarations:** jco's `/// <reference path="./<iface>.d.ts" />` lines (for an interface that `use`s another) pointed at files we don't write; removed, since all interfaces go in one file.
- **First-call timing:** measured with calculator + regexped composed (fresh instance per request, `fastedge-run`). The first string argument cost ~150–220 µs: `'a'.charCodeAt` in the glue's own global sets up String lazily. Added String, BigInt and Error to the Wizer-time warm-up (`GLUE_WARMUP`). First calls now: regexped ~70 µs, `describe` (record with string) ~30–60 µs, `u64` ~7 µs, other calls ~7–25 µs, first `err` ~60–100 µs; second calls 4–20 µs. Findings, ruled-out fixes and the diagnosis method: `development/COMPONENT_PERFORMANCE.md`.
- Not included: github-pages user docs (separate PR).

## [2026-10-21] — Engine: component-import hooks (ComponentizeJS embedding)

### Overview
Adds the ComponentizeJS `embedding` builtin to the engine so a later `fastedge-build` change can splice user-supplied Wasm component imports. No behaviour change for existing builds.

### Changes
- Vendored `runtime/fastedge/builtins/embedding/` from ComponentizeJS 0.23.0, registered as `componentize::embedding` in `runtime/fastedge/CMakeLists.txt`. The engine now exports 7 `coreabi_*` functions (+~14 KB).
- Removed its `console.log` override (duplicate symbol with `console-override.cpp`); `install()` is inert unless `SOURCE_NAME` is set, so plain Wizer builds don't hit its unguarded `getenv`.
- Verified on the new engine: unit 441/441, integration 67/67, all 22 examples × 60 fixtures identical to the stock engine (bar timestamp-dependent output), fastedge-test HTTP integration 81/81.

## [2026-10-14] — Security review fixes: release-workflow injection, manifest escaping, symlinks

### Overview
Fixes from a pre-release security review. The remaining low-severity items are tracked for a follow-up PR (outside this repo, in the coordinator's `context/tasks/fastedge-sdk-js-security-review.md`).

### Changes
- **Release workflow:** the `dry_run` dispatch input was a free string interpolated into bash in the publishing job (`release.yaml`), so a dispatch could run commands with `contents`/`id-token` write. It is now a boolean, read through `env`. Pushes still always dry-run.
- **Manifest escaping:** the generated asset manifest wrote publicDir file names inside `'...'` with no escaping (`prettierObjectString`), so a `'`, `\` or newline in a file name broke out of the string. That broke the build for names like `John's photo.jpg`, and could inject code that runs at Wizer init. Entries are now written with `JSON.stringify` and `prettierObjectString` is removed. A test evaluates the generated module for a hostile file name.
- **Stateful regexes:** `extendedCache` and custom `contentTypes` regexes with `g` or `y` kept `lastIndex` between `test()` calls, so alternate requests or files didn't match. The normalizer now gives each one a private copy with its flags kept (`privateRegex`; dropping `y` would turn an anchored match into a search), and the test sites reset `lastIndex` before each test. The caller's RegExp is never mutated.
- **Symlinks:** `getFilesRecursively` treated symlinks as files and `readFileSync` followed them, so a link such as `public/robots.txt -> ../.env` embedded that file and published it. Symlinks are now followed only when they resolve to a regular file inside the input directory. Other links are skipped with a warning, and links to directories previously crashed the build with `EISDIR`. Only regular files are collected, so FIFOs and sockets are not picked up. The `.generation-config.md` rule is added and ASSETS_CLI / STATIC_SITES are regenerated.

## [2026-10-14] — Generated docs verified against the code; static-site config bugs fixed

### Overview
Every claim in the seven generated `docs/` files was checked against the source (three read-only passes). The errors were fixed upstream: in code, JSDoc, the generator's source sets and `.generation-config.md`, never by editing the docs. All docs were then regenerated.

### Changes
**Code fixes (static sites)**
- Custom `contentTypes` never applied: `normalizeAssetCacheConfig` used `'stringArray'`, turning each rule object into `''`. A new `'array'` normalizer (`config-helpers.ts`) passes entries through; `getKnownContentTypes` still validates them.
- `fastedge-init` wrote `ignoreDirs`, which was only logged. It now writes `ignorePaths`; `createManifestFileMap` also applies a legacy `ignoreDirs` (normalized) so existing configs get the exclusion they asked for.
- `extendedCache`: `normalizePathsOrRegex` stripped trailing slashes, so the prefix branch in `testExtendedCache` only ever matched `'/'`, and `RegExp` entries (allowed by `ServerConfig`) crashed on `.startsWith`. A trailing `/` is now kept and `RegExp` entries pass through.
- `fastedge-init` checked `./index.html` instead of the SPA entrypoint the user entered.

**JSDoc and README**
- `types/fastedge-cache.d.ts`: validation errors are `Error`, not `TypeError`. The JSDoc now gives the full TTL rules (past `expiresAt`, the `MAX_SAFE_INTEGER` bound, `null` = no options), says which errors throw and which reject, and says that `expire` requires an expiry.
- `types/globals.d.ts`: `location` documented. `types/fastedge-secret.d.ts`: `effectiveAt` is converted to int32 and clamped at 0.
- README: Node v22 (matches `engines`).

**Generator (`fastedge-plugin-source/`)**
- `SOURCE_FILES` now includes the files that implement each documented behaviour (loader, validation, normalizers, static server, inline assets, init writers), not just the CLI entry points.
- `.generation-config.md` gets global rules (correct any baseline claim the sources do not support; describe CLI behaviour from the CLI path; show generated files verbatim; examples define every identifier) and per-doc accuracy rules for each verified finding. The crypto matrix moves `getRandomValues()` off `crypto.subtle`, `GeoData` becomes `GeoInfo`, and INDEX lists every doc (including the hand-written ones) and drops the hardcoded version.

## [2026-10-14] — Platform-neutral fastedge-build (no native bindings except wizer)

### Overview
`fastedge-build` now runs from a `node_modules` installed on another OS, so the FastEdge MCP server can build a macOS- or Windows-installed project in its Linux container without reinstalling (and corrupting) the host's `node_modules` (G-Core/FastEdge-mcp-server#61).

### Changes
- `componentNew` / `metadataAdd` import from `@bytecodealliance/jco-transpile/wasm-tools` instead of `@bytecodealliance/jco`. jco's root entry statically loads native napi modules (oxc-minify, rolldown, jco-node-fs) and failed with "Cannot find native binding" on a foreign-OS tree. Dependency swapped to `@bytecodealliance/jco-transpile`.
- Bundling uses `esbuild-wasm` instead of `esbuild`. A host can't substitute its own esbuild binary because esbuild requires the binary version to match the JS package exactly. Measured: ~0.5s vs ~0.05s to bundle a ~930KB hono + react app; small next to wizer. Native `esbuild` stays as a devDependency for the SDK's own build scripts.
- `FASTEDGE_WIZER_PATH` overrides the wizer binary. `@bytecodealliance/wizer` is now imported lazily, only when the variable is unset, since the package throws at load time when this platform's binary is missing.
- CI guard (`integration-tests/cross-platform-build.test.js`, runs on the Ubuntu/Windows/macOS matrix): builds under a `node --import` preload (`integration-tests/test-files/no-native/`) that makes `process.dlopen` throw and rejects resolving `esbuild`, `@esbuild/*`, the `@bytecodealliance/jco` root and `@bytecodealliance/wizer*`, with `FASTEDGE_WIZER_PATH` set. Each runner otherwise has its own native packages, so without it a dependency bump that reintroduced one would stay green. Checked: reverting to native `esbuild`, or to a static wizer import, fails only this test.
- Audit: `npm-run-all2` moved to devDependencies. It only runs this repo's package scripts, and nothing shipped references it, but as a dependency it brought `shell-quote@1.9.0` (critical, GHSA-pqg4-j6r4-53mv) into every consumer install. `shell-quote` → 1.12.0 and the `brace-expansion` override → `^5.0.12` in the lockfile. A clean consumer install of the packed SDK now audits at 0 vulnerabilities. The remaining `pnpm audit` findings are in `github-pages/`, `examples/` and root dev tooling, none of which is published.
- Verified: with every Linux native package deleted from an install of the packed SDK, `fastedge-build` with `FASTEDGE_WIZER_PATH` set builds a hono app that serves 200 under `@gcoredev/fastedge-test`.

## [2026-09-15] — Shell-free child processes, TypeScript 5/6/7 compatibility, cross-platform CI

### Overview
Removed `shell: true` from every `spawnSync` in the build path, replaced the `npx tsc` invocation with direct resolution of the consumer's TypeScript, and added CI covering three operating systems and four TypeScript majors. Cleared all outstanding dependency advisories.

### Changes

**Child processes (`src/componentize/componentize.ts`, `src/utils/syntax-checker.ts`):**
- All three `spawnSync` calls dropped `shell: true`. They interpolated paths into a string the shell then re-parsed, so an argument value could be read as shell syntax instead of a path. No shell is needed: `wizer` (from `@bytecodealliance/wizer`) and `process.execPath` are absolute paths to binaries.
- `-r _start=wizer.resume` became two argv entries (`'-r'`, `'_start=wizer.resume'`). It was previously one entry containing a space, which only produced two arguments because the shell re-split it — without a shell, wizer receives one malformed argument.
- `process.execPath` was wrapped in literal quotes (`"${process.execPath}"`) for the shell's benefit; those quotes became part of the path once the shell was gone.
- Side effect: paths were interpolated unquoted, so any input or output path containing a space previously failed to build. That now works, and has its own regression tests separate from the argument-handling ones.
- Scope note: this is defense in depth rather than a fix for a reachable exploit. Every shipped caller either already has code execution (a developer at a terminal; `.fastedge/build-config.js`, which `load-config-file.ts` runs through `await import()`) or already validates (FastEdge-mcp-server constrains entry/output/tsconfig via `normalizePath()` → `INVALID_PATH`; FastEdge-vscode spawns with an argv array behind a trusted-workspace guard). No CVE or advisory was filed for that reason.
- A path-containment check in the SDK was considered and not added: containment is already enforced by the callers above, and restricting output to the working directory would break legitimate builds such as `fastedge-build src/index.js ../dist/app.wasm`.

**TypeScript invocation (`src/utils/syntax-checker.ts`):**
- `npx` is no longer used. On Windows it is a `.cmd` shim, and since the fix for CVE-2024-27980 Node refuses to spawn `.bat`/`.cmd` without `shell: true`. Naming `npx.cmd` explicitly was tried first and fails with `EINVAL`, so the only shell-free option is to run TypeScript's own entry point under `process.execPath`.
- `resolveTypeScript()` resolves `typescript/package.json` and reads that manifest's `bin.tsc`, rather than resolving the `typescript/bin/tsc` subpath directly. TS 7 ships an `exports` map listing only `./package.json`, `.` and `./unstable/*`, so the direct subpath throws there while working on TS 5. Every major from 5.0 to 7.0 has `bin.tsc` pointing at a real file.
- The TypeScript version now comes from that manifest instead of a `tsc --version` child process, removing a spawn site.
- Resolution is rooted at `process.cwd()`, i.e. the project being built. Under Yarn PnP there is no `node_modules` and the CLI runs without PnP loader hooks, so resolution fails and reports "TypeScript is not installed." That is a deliberate trade: it fails with an actionable message rather than mis-building, and the alternative (`npx`) is what breaks Windows.

**TypeScript version behaviour (verified against real installs of 5.0.4, 5.5.4, 5.9.3, 6.0.0-beta, 7.0.2):**
- `--module esnext` is now passed explicitly alongside `--moduleResolution bundler`. `bundler` requires module `preserve` or es2015+, and leaving it implicit ties that to `--target` staying high (TS derives module from target, so lowering the target fails with TS5095). More significantly, the value TS infers from `--target esnext` alone is es2015, which rejects `import.meta` with TS1343 even though it is valid ESM the runtime supports — that was true before this change too, under the old `node` resolution. `esnext` matches how input is actually consumed, since esbuild bundles ESM.
- `--moduleResolution` changed from `node` to `bundler`. `node` means node10, which TS 7 removed outright: every `.ts` build failed with TS5108 for a consumer on TS 7, and this was the cause of 4 pre-existing `test:integration` failures on `main`. `bundler` is supported from TS 5.0 and describes how input is actually consumed, since it is esbuild-bundled before componentization.
- `--ignoreDeprecations` is passed only for a consumer's own tsconfig (`--project`), and its value follows the major: `"6.0"` from TS 6, `"5.0"` on TS 5, omitted from TS 7. TS 6 rejects `"5.0"` with TS5107 and requires `"6.0"`, so a single constant regresses one major or the other. From TS 7 the affected options are removed rather than deprecated and no value suppresses them. The SDK's own default flags use no deprecated option, so they pass none.
- `moduleResolution: node` in a consumer tsconfig behaves differently in each major: accepted silently on 5.0/5.5/5.9, TS5107 on 6.0.0-beta (suppressible only with `"6.0"`), TS5108 on 7.0.2 (not suppressible).
- On TS 5.0.4, `preserveValueImports`, `keyofStringsOnly`, `noImplicitUseStrict` and `suppressImplicitAnyIndexErrors` all error without `--ignoreDeprecations` and are silenced by `"5.0"`. `importsNotUsedAsValues` emits nothing on 5.x despite looking like it belongs in that list. By 5.9 these are removed and no flag helps.
- There is no stable TypeScript 6 — npm publishes only `6.0.0-beta` and `6.0.0-dev.*`, and TypeScript went 5.9 → 7.0. The prereleases are installable, so the TS 6 branch is still reachable.

**Testing:**
- `integration-tests/cross-platform-build.test.js` (new), run by `pnpm run test:cross-platform` — wasm output, spaces in input and output paths, literal argument passing, and per-platform checks that argument values are not interpreted by a shell. Payloads are platform-specific and must end in `.wasm`: `validateFilePaths()` rejects anything else before the spawn is reached, and cmd.exe does not honour `$(...)`, so a single generic payload would pass without testing anything. Checked against the pre-fix code, where 4 of the 5 tests fail.
- `integration-tests/typescript-versions.test.js` (new) — installs TypeScript 5.0.4, 5.9.3, 6.0.0-beta and 7.0.2 into sandboxes and asserts the per-major behaviour above. Installs carry their own `spawnSync` timeout because `spawnSync` blocks Jest's event loop, so Jest's test timeout cannot interrupt a stalled install. Each assertion was checked to fail when the corresponding fix is reverted.

**Windows build fixes (both found by the new matrix, both pre-existing on `main`):**
- `src/server/static-assets/asset-loader/__mocks__/fastedge::fs.ts` deleted; `inline-asset.test.ts` now mocks with `{ virtual: true }`. The file name contained a colon, which is not a legal path character on NTFS, so `actions/checkout` aborted with `error: invalid path` and exit 128 on `windows-latest` — the Windows matrix leg could never reach the build, and the repository could not be cloned on Windows at all. The file existed only to make `fastedge::fs` resolvable: jest-haste-map registers every file under any `__mocks__` directory as a project-wide manual mock keyed by file name, and `jest.mock()` with a factory still requires the module to resolve. `virtual: true` is the correct mechanism here, since `fastedge::fs` is supplied by the FastEdge runtime and has no on-disk module. Do not restore a colon-named fixture for any other `fastedge::*` module.
- `esbuild/cli-binaries.js` — `prependNodeShebangToFile()` passed `path.resolve(process.cwd(), ...)` through `new URL(..., import.meta.url)` and `fileURLToPath()`. `path.resolve` already returns an absolute filesystem path, so the round-trip was a no-op on POSIX (a leading `/` resolves against the `file:` base) and threw `ERR_INVALID_URL_SCHEME` on Windows, where an absolute path begins with a drive letter and `D:\a\...` parses as scheme `d:` instead of a path. Verified: `new URL("D:\\a\\repo\\bin\\a.js", "file:///...")` yields `protocol: "d:"`. Now uses `path.resolve` directly; `fileURLToPath` import dropped. `build:cli` was therefore broken on Windows for every consumer building from source, not just in CI. (`src/utils/npx-path.ts` uses `fileURLToPath(import.meta.url)`, which is the correct form and is unaffected.)

**CI:**
- `.github/workflows/cross-platform-tests.yaml` (new) — ubuntu/windows/macos matrix; each platform typechecks, builds CLI/libs/types and runs the full JS→wasm pipeline. Gates `npm_release`. Nothing previously validated the build off Linux, and `test:integration` ran only inside the release path, so pull requests never exercised it.
- The runtime wasm reaches the matrix as an artifact from `build-libs.yaml` rather than the build cache, because `actions/cache` does not share entries across operating systems — Windows and macOS cannot restore the Linux-written cache without `enableCrossOsArchive` on every save and restore. The existing `${{ runner.os }}`-keyed cache is unchanged; it was briefly renamed while the matrix still used it, then restored once the artifact removed the need.
- The upload sets `overwrite: true` (v4 artifacts are immutable, so rerunning a run would otherwise hit a name conflict). The workflow is `workflow_call` only: the artifact comes from `build-libs` in the same run, and `download-artifact` cannot reach a previous run's artifacts.
- `build-libs` and `prod-invocation` remain self-hosted — they are the only jobs needing Vault and Harbor on `gc.onl`. `code-validation` and `unit-tests` were reachable from fork pull requests with no internal dependency, so they and the remaining jobs moved to GitHub-hosted runners, which are free for public repositories.

**Dependencies:**
- `pnpm audit`: 1 critical, 24 high, 29 moderate, 4 low → 0. Every advisory sat in a workspace package (`github-pages`, `examples/*`) or a devDependency, so the exposure was development and CI only.
- The published set is `types/`, `bin/fastedge-{assets,build,init}.js`, `lib/*.wasm`, `lib/*.js` and `README.md`. Note that `lib/*.js` and `bin/*.js` are esbuild bundles with `bundle: true`, so a dependency they import would be *inlined* into the published artifact rather than resolved by the consumer — the published set alone does not settle the question. Checked against esbuild metafiles: `lib/create-static-server.js` has 9 inputs, all first-party `src/` and no `node_modules`; `bin/*.js` inline 42 npm packages (jco, wizer, acorn, esbuild, enquirer, magic-string, regexpu-core and their transitives), none of which appears in the advisory list. `types/` is declarations only and `lib/*.wasm` is the compiled runtime.
- The `overrides` block in `pnpm-workspace.yaml` had gone stale (`fast-uri: ^3.1.1` no longer covered the `>=3.1.6` advisory) and was refreshed; `astro`, `sharp` and `hono` bumped directly.

---

## [2026-06-09] — Response.clone() full isolation + headers-clone fix; prod guard expanded

### Overview
Completed `Response.clone()`: the body tee now hands each branch independent chunks, and cloning a response after its headers have been read no longer throws. Squashed the Response.clone work into a single commit on `gcore/integration` and re-pinned the submodule. Expanded the prod-invocation guard.

### Changes

**Runtime (StarlingMonkey submodule, `gcore/integration`):**
- `fix(fetch): Response.clone - full clone isolation via cloneForBranch2 tee` — replaces the initial tee (which shared one chunk object between branches) with a hand-rolled `ReadableStreamDefaultTee` (`cloneForBranch2 = true`): branch1 keeps the original chunk, branch2 receives an eager structured clone taken at source-read time. Per-branch cancellation tracked (`canceled1`/`canceled2`).
- Header cloning rewritten to clone via the header handle (`headers_handle_clone`) instead of replaying entries through a guarded append. Fixes `TypeError: Headers are immutable` when cloning an incoming response after its headers were materialised, and preserves multiple `Set-Cookie`.
- The two earlier Response.clone commits (`feat` + wpt expectations) squashed into one; submodule re-pinned `84f5d52` → `702d7a4` (`gcore/integration` = `0.3.0` → Response.clone → blob #311 fix).
- WPT `fetch/api/response/response-clone.any.js` — 21/21.

**Prod-invocation test application:**
- `response-clone` guard extended to 9 sub-tests: host-backed multi-chunk mutation guard (7), cancel-one-branch (8), read-header-then-clone (9).
- `handlers/multi-chunk-source.ts` added — serves a multi-chunk body the guard self-fetches (over https) to exercise a host-backed `HttpIncomingBody` re-segmented across multiple host reads.
- `KNOWN_LIMITATIONS.md` — removed the now-resolved `Response.clone()` tee-bug entry.

---

## [2026-06-08] — Response.clone(), blob.type fix, prod-invocation test infrastructure

### Overview
Implemented `Response.clone()` and `blob.type` propagation in the StarlingMonkey runtime via a `gcore/integration` fork branch. Restructured the prod-invocation test application to be extensible and TypeScript-first.

### Changes

**Runtime (StarlingMonkey submodule):**
- `feat(fetch): implement Response.clone()` — upstream PR #312 (open)
- `fix(fetch): body.blob() sets Blob.type from Content-Type header` — upstream issue #311 (open)
- Submodule now pinned to `godronus/gcore/integration` (SHA `84f5d52`) rather than bare `0.3.0` tag
- `context/PATCHES.md` added — documents applied patches, upstream PR links, rebase procedure, and test guard removal checklist

**Prod-invocation test application (`integration-tests/test-application/`):**
- Converted from a single flat JS file to TypeScript with Hono routing
- Split into `handlers/` (WASM context, `fastedge::` imports) and `checks/` (Node.js, auto-discovered)
- `routes.ts` — single source of truth for route paths and test names
- `types.ts` — shared `CheckContext`, `HandlerModule`, `CheckModule` interfaces
- Build artefacts consolidated under `dist/` (one gitignore entry covers both wasm and compiled checks)
- Temporary `response-clone` handler + check added as regression guard for the StarlingMonkey patches
- `scripts/build-test-app.js` + `scripts/run-test-app-checks.js` — local equivalents of CI scripts
- `pnpm test:app:build` and `pnpm test:app:check` scripts added
- `integration-tests/test-application/README.md` added

---

## [2026-05-05] — Pin host-api bindings to wit-bindgen 0.30.0 (fix wasmtime 36 trap)

### Overview
Reverted the wit-bindgen pin from 0.37.0 back to 0.30.0 after a canonical-ABI lowering regression in 0.37.0 caused every JS-built component to trap `pointer not aligned` on wasmtime 36 hosts (FastEdge edge), surfacing as `530: fastedge: Execute error` for all examples — including hello-world that doesn't touch any new interface.

### Root cause
`wit-bindgen` 0.37.0 generates lowering code that reads pointer/length fields from variant-with-string types at unaligned offsets (e.g. `ptr+1` where 0.30.0 used `ptr+4`). wasi:http result/option decoding hits these helpers early on every incoming request, so the trap fires before the guest can invoke `response-outparam::set`.

### Changes
- **Regenerated** `runtime/fastedge/host-api/bindings/{bindings.c,bindings.h,bindings_component_type.o}` with `wit-bindgen-cli@0.30.0` against the full branch WIT (cache-sync, cache-types, utils included). 0.30.0 parses these interfaces fine — the prior 0.37.0 pin was unnecessary.
- **Documented** the regression and required version in `context/development/BUILD_SYSTEM.md` (new "WIT Bindings & wit-bindgen Version" section) including diff illustrating the offset change.
- **No source changes** to `fastedge_host_api.{cpp,h}`, `world.wit`, `cache.cpp`, or any builtin — only the generated bindings layer.

### Verification
- `examples/hello-world/dist/hello-world.wasm` runs cleanly on the wasmtime 36 edge host.
- `examples/cache-basic/dist/cache-basic.wasm` runs and exercises the `Cache.get/set/exists/delete` flow.

### Notes
- The fix is silent at build time — only request-time execution surfaces the trap. Any future wit-bindgen bump must be retested on a wasmtime 36 host before merging.
- The `runtime/fastedge/scripts/create-wit-bindings.sh` script does not enforce the version. We intentionally did not hard-code it; the version contract is documented in `BUILD_SYSTEM.md` instead.

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
  - Uncommented `StreamPipeOptions.signal` (was a stale comment — StarlingMonkey's `pipeTo` wrapper passes `options` through unmodified to SpiderMonkey's native `ReadableStream.prototype.pipeTo`, which fully implements signal-driven aborts; see `runtime/StarlingMonkey/builtins/web/streams/transform-stream.cpp:55`). Also lifted the misplaced JSDoc that was attached to `preventClose` up to the interface.
  - Added Option-A explanatory marker blocks to `RequestInit`, `Request`, `Response`, and `SubtleCrypto` so that future maintainers can see at a glance which spec fields/methods are intentionally absent and where to look in the runtime when re-evaluating support.
  - **Removed** (no implementation in either StarlingMonkey or `runtime/fastedge/builtins/`): `Request.setCacheKey`, `Request.setManualFramingHeaders`, `Response.setManualFramingHeaders`, and the corresponding `manualFramingHeaders` flags on `RequestInit`/`ResponseInit`. These were inherited from a Fastly types copy and threw `TypeError` at runtime.
  - Confirmed staying commented out (not parsed by `request-response.cpp`): `cache`, `credentials`, `redirect`, `mode`, `integrity`, `keepalive`, `referrer`, `referrerPolicy`, `window`, `Response.clone()`, `Response.error()`.

### Type-vs-runtime audit (Slice C)

A second pass closed real gaps where the runtime exposes APIs but `globals.d.ts` either didn't declare them or narrowed them incorrectly. All findings verified against `runtime/StarlingMonkey/builtins/` C++ sources before applying.

- **Byte streams added** — declared `ReadableStreamBYOBReader`, `ReadableStreamBYOBRequest`, `ReadableByteStreamController`, plus the BYOB overload on `ReadableStream.getReader({ mode: 'byob' })` and supporting types (`ReadableStreamGetReaderOptions`, `ReadableStreamBYOBReaderReadOptions`). Replaced the narrowed `ReadableStreamReader<T>` and `ReadableStreamController<T>` aliases with the spec-correct unions. Confirmed available via `runtime/StarlingMonkey/CHANGELOG.md` and the WPT expectations under `tests/wpt-harness/expectations/streams/` — the implementation comes from SpiderMonkey 140 directly with StarlingMonkey passing through.
- **Queuing strategy classes added** — `ByteLengthQueuingStrategy`, `CountQueuingStrategy`. Previously only the `QueuingStrategy<T>` and `QueuingStrategyInit` shapes were declared; the actual classes were missing.
- **Compression streams added** — `CompressionStream`, `DecompressionStream`, `CompressionFormat = 'deflate' | 'deflate-raw' | 'gzip'`. Verified against `runtime/StarlingMonkey/builtins/web/streams/{compression,decompression}-stream.cpp` — surface is just `readable` + `writable` properties (constructors take the format string).
- **`KeyFormat` widened** to `'jwk' | 'pkcs8' | 'raw' | 'spki'` — PKCS#8 was added in StarlingMonkey 0.2.0 (per their CHANGELOG); SPKI is supported for ECDSA imports too. Confirmed via the format `switch` statements in `crypto-algorithm.cpp` (lines 1503/1650/1745/1778, etc.).
- **`SubtleCrypto.sign`/`verify` accept `EcdsaParams`** — added `EcdsaParams { name: 'ECDSA'; hash: HashAlgorithmIdentifier }` and broadened the live overloads. `crypto-algorithm.cpp:729` parses ECDSA params (extracts `hash`); without `EcdsaParams` in the type, customers can't pass `{ name: 'ECDSA', hash: 'SHA-256' }` without a cast.
- **`SubtleCrypto.importKey` algorithm union widened** — `EcKeyImportParams` now appears in both the JWK and binary-format overloads (was previously only on JWK), and `HmacImportParams` appears in both (was previously only on binary). Verified `CryptoAlgorithmECDSA_Import::importKey` supports `Jwk`/`Pkcs8`/`Raw`/`Spki` (lines 1503/1650/1745/1778) and `CryptoAlgorithmHMAC_Import::importKey` supports `Raw`/`Jwk` (line 1431).
- **`Transferable` narrowing unchanged** — confirmed only `ArrayBuffer` is transferable. Replaced the bare `// MessagePort | ImageBitmap` comment with one explaining *why* (no Worker/Canvas APIs in StarlingMonkey, so neither type is exposed).
- **MultipartFormData NOT declared** — the class is registered as a global name (`form-data-encoder.cpp:569-572,697`) but has zero JS-accessible methods, zero properties, and `NoCtorBuiltin` for its constructor. It's an internal helper used by `FormData` encoding, not part of the public API. Skipped intentionally.
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
