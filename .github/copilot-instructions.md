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

## Generated Content — `docs/`

Files in `docs/` are **machine-generated** from source code by `./fastedge-plugin-source/generate-docs.sh`. They must not be edited by hand — manual changes will be silently overwritten on the next generation run.

### When reviewing PRs that touch `docs/`:

- **Never** suggest manual edits to any file in `docs/`
- If docs are stale or incorrect, suggest: **Run `./fastedge-plugin-source/generate-docs.sh`**
- If the generated output itself is wrong (e.g., wrong structure, missing section), the fix belongs in `fastedge-plugin-source/.generation-config.md`, not in `docs/` directly
- If a PR modifies `docs/` files without a corresponding source code change, flag it — the change should come from the generation script, not a hand-edit

### When reviewing PRs that change source code covered by `docs/`:

- Check whether the change affects the public API or user-facing behavior
- If yes, and `docs/` was not regenerated in the same PR, **request changes** with:
  > Source code affecting public API was changed but docs/ was not regenerated.
  > Run: `./fastedge-plugin-source/generate-docs.sh`

## Documentation Freshness

### Public API changes (must regenerate docs/)
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
| `types/`, `src/cli/`, `README.md` (quickstart examples) | `docs/quickstart.md` |
| `fastedge-plugin-source/manifest.json` | `.github/copilot-instructions.md` |

### Violation example

> PR changes `BuildConfig` interface in `types.ts` but `docs/BUILD_CLI.md` still shows the old field names → **request changes**. Run `./fastedge-plugin-source/generate-docs.sh` before merge.

### Quickstart protection

If any public API signature or CLI behavior changes, check whether `docs/quickstart.md` examples are still accurate. Request regeneration if examples would no longer work against the updated code.

### Pipeline source contract

If `fastedge-plugin-source/manifest.json` lists source files that overlap with files changed in this PR, request that `docs/` is regenerated (run `./fastedge-plugin-source/generate-docs.sh`) to keep the plugin pipeline's source material current.

## Quality Rules

- All TypeScript signatures in docs must match `types/` declarations exactly
- All CLI flags in docs must match `arg()` definitions in source
- KvStore `get()` returns `ArrayBuffer | null` (not string) — flag incorrect types
- No marketing language in documentation — precise, technical prose only
