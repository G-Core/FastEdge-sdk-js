# Copilot PR Review Instructions — FastEdge-sdk-js

## Constitution

This repository is `@gcoredev/fastedge-sdk-js` — the JavaScript/TypeScript SDK for Gcore FastEdge. It provides three CLI tools (`fastedge-build`, `fastedge-init`, `fastedge-assets`), a static site server API (`createStaticServer`), and TypeScript type definitions for the FastEdge WASM runtime.

### Principles (enforce during review)

1. **Type accuracy** — TypeScript declarations in `types/` are the authoritative public API surface. Code and docs must match them exactly.
2. **No over-engineering** — Simple solutions over complex abstractions. Three similar lines > premature abstraction.
3. **CLI flag consistency** — All CLI flags must match `arg()` definitions in `src/cli/*/`. No undocumented flags, no documented-but-removed flags.
4. **Build pipeline integrity** — The componentize pipeline (esbuild → Wizer → JCO) is sensitive to ordering. Changes must preserve stage dependencies.
5. **Runtime constraints** — Code targeting the WASM runtime has strict limitations (no Node APIs, init-time-only Wizer calls). Reviewers must flag violations.

### Public API contract

The public API surface is defined by:
- `types/` — TypeScript declarations (runtime APIs, static server, KV store)
- `src/cli/fastedge-build/` — Build CLI flags and config interface
- `src/cli/fastedge-init/` — Scaffold CLI wizard
- `src/cli/fastedge-assets/` — Asset manifest CLI
- `src/server/static-assets/static-server/` — `createStaticServer` API

Changes to these surfaces require updated `docs/`, updated tests, and a semver-appropriate version bump.

## Documentation Freshness

`docs/` is the single source of truth for public API documentation. When code changes affect the public API or user-facing behavior, **request changes** if the corresponding doc file was not updated in the same PR.

### Public API changes (must update docs/)
- New, modified, or removed CLI flags in `src/cli/fastedge-build/build.ts`
- Changes to `BuildConfig` or `AssetCacheConfig` interfaces in `src/cli/fastedge-build/types.ts`
- Changes to scaffold wizard behavior in `src/cli/fastedge-init/`
- Changes to asset manifest CLI in `src/cli/fastedge-assets/`
- Changes to `createStaticServer` API or `ServerConfig` in `src/server/static-assets/`
- Changes to TypeScript declarations in `types/`
- Changes to `package.json` exports or bin entries

### Mapping: code location → doc file

| Code path | Doc file |
|-----------|----------|
| `src/cli/fastedge-build/` (flags, config) | `docs/BUILD_CLI.md` |
| `src/cli/fastedge-build/types.ts` (BuildConfig) | `docs/BUILD_CLI.md` |
| `src/cli/fastedge-build/config-build.ts` (build types) | `docs/BUILD_CLI.md` |
| `src/cli/fastedge-init/` (wizard, templates) | `docs/INIT_CLI.md` |
| `src/cli/fastedge-assets/` (manifest CLI) | `docs/ASSETS_CLI.md` |
| `src/server/static-assets/static-server/` | `docs/STATIC_SITES.md` |
| `src/server/static-assets/asset-manifest/` | `docs/ASSETS_CLI.md` |
| `types/fastedge-env.d.ts` | `docs/SDK_API.md` |
| `types/fastedge-secret.d.ts` | `docs/SDK_API.md` |
| `types/fastedge-kv.d.ts` | `docs/SDK_API.md` |
| `types/globals.d.ts` | `docs/SDK_API.md` |
| `package.json` (exports, bin) | `docs/INDEX.md` |
| `fastedge-plugin-source/manifest.json` | `.github/copilot-instructions.md` |

### Violation example

> PR changes `BuildConfig` interface in `types.ts` but `docs/BUILD_CLI.md` still shows the old field names → **request changes**. The config interface must be documented before merge.

### Quickstart protection

If any public API signature or CLI behavior changes, check whether `docs/quickstart.md` examples are still accurate. Request changes if examples would no longer work against the updated code.

### Pipeline source contract

If `fastedge-plugin-source/manifest.json` lists source files that overlap with files changed in this PR, request that `docs/` is updated to keep the plugin pipeline's source material current.

## Quality Rules

- All TypeScript signatures in docs must match `types/` declarations exactly
- All CLI flags in docs must match `arg()` definitions in source
- KvStore `get()` returns `ArrayBuffer | null` (not string) — flag incorrect types
- No marketing language in documentation — precise, technical prose only
