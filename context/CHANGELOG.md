# Changelog

Track significant changes to the FastEdge JS SDK codebase.
When this file grows large, use grep to search — don't read linearly.

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
