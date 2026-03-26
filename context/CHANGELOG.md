# Changelog

Track significant changes to the FastEdge JS SDK codebase.
When this file grows large, use grep to search — don't read linearly.

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
