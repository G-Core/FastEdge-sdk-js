# AI Agent Instructions for FastEdge JS SDK

## Governance (REQUIRED)

Read `AGENTS.md` for company-wide agent rules. These are mandatory and override any conflicting behavior. Key rules: never go beyond the assigned task, never change code that was not asked to change, never "improve" or "optimize" without a clear request, always distinguish observations from action requests.

---

## CRITICAL: Read Smart, Not Everything

**DO NOT read all context files upfront.** This repository uses a **discovery-based context system** to minimize token usage while maximizing effectiveness.

---

## Getting Started: Discovery Pattern

### Step 1: Read the Index (REQUIRED — ~130 lines)

**First action when starting work:** Read `context/CONTEXT_INDEX.md`

This lightweight file gives you:
- Project quick start (what this repo does in 10 lines)
- Documentation map organized by topic with sizes
- Decision tree for what to read based on your task
- Search patterns for finding information

### Step 2: Read Based on Your Task (JUST-IN-TIME)

Use the decision tree in CONTEXT_INDEX.md to determine what to read. **Only read what's relevant to your current task.**

**Examples:**

**Task: "Add a new CLI flag to fastedge-build"**
- Read: `context/development/BUILD_SYSTEM.md` (CLI build section)
- Read: `src/cli/fastedge-build/build.ts` (entry point)
- Grep: `context/CHANGELOG.md` for similar past changes

**Task: "Fix regex precompilation bug"**
- Read: `context/architecture/COMPONENTIZE_PIPELINE.md` (Stage 2)
- Read: `src/componentize/precompile.ts`
- Run: `pnpm run test:unit:dev` to verify

**Task: "Add new host API (e.g., cache)"**
- Read: `context/architecture/RUNTIME_ARCHITECTURE.md` (builtins + WIT)
- Read: `runtime/fastedge/builtins/fastedge.cpp` (template)
- Run: `pnpm run generate:wit-world` after changes

**Task: "Update TypeScript type definitions"**
- Read: `types/` directory (authoritative API surface)
- Run: `pnpm run build:types` to verify
- Check: `github-pages/src/content/docs/reference/` if user-facing docs need updates

### Step 3: Search, Don't Read Everything

**Use grep and search tools** instead of reading large files linearly:

- **CHANGELOG.md**: Will grow over time — always grep, never read end-to-end
- **Architecture docs** (~160-170 lines): Read specific sections by heading
- **Source code**: Use path aliases to navigate (`~componentize/`, `~utils/`, etc.)

---

## Decision Tree Reference

**Quick lookup for common tasks:**

| Task Type | What to Read |
|-----------|-------------|
| **Adding a CLI feature** | BUILD_SYSTEM + relevant CLI entry point |
| **Fixing componentize bug** | COMPONENTIZE_PIPELINE + specific stage file |
| **Adding runtime host API** | RUNTIME_ARCHITECTURE (builtins + WIT sections) |
| **Modifying static assets** | COMPONENTIZE_PIPELINE (Build Types) + `src/server/static-assets/` |
| **Updating type definitions** | `types/` directory + `github-pages/` reference docs |
| **Adding an example** | Browse `examples/` for similar existing example |
| **Changing build system** | BUILD_SYSTEM + `esbuild/` scripts |
| **Working with WIT** | RUNTIME_ARCHITECTURE (WIT section) + `runtime/FastEdge-wit/` |
| **Writing tests** | TESTING_GUIDE |
| **Understanding the system** | PROJECT_OVERVIEW (~150 lines) |
| **Updating docs site** | `github-pages/` (Astro, separate workspace) |
| **Working on fastedge-init** | `src/cli/fastedge-init/` + PROJECT_OVERVIEW (Build Types) |

---

## Anti-Patterns (What NOT to Do)

**Don't:** Read all 6 context docs upfront (~700 lines wasted if you only need one)
**Don't:** Read `runtime/` C++ source for JS-only CLI changes
**Don't:** Read `github-pages/` Astro source when working on SDK internals
**Don't:** Read entire architecture docs when you need one specific section
**Don't:** Modify `lib/*.wasm` directly — these are build artifacts

**Do:** Read `context/CONTEXT_INDEX.md` first — always
**Do:** Use grep to search CHANGELOG and large source files
**Do:** Read `types/` for the authoritative public API surface
**Do:** Read `examples/` for real-world usage patterns
**Do:** Follow path aliases (`~componentize/`, `~utils/`) when navigating source

---

## Critical Working Practices

### Task Checklists (ALWAYS USE)

When starting any non-trivial task (multi-step, multiple files, features, etc.):

1. Use `TaskCreate` to break work into discrete steps
2. Mark tasks `in_progress` when starting, `completed` when done
3. This helps track progress and prevents missed steps

### Parallel Agents

For independent work, spawn parallel agents:
- Research different subsystems simultaneously
- Run tests while writing docs
- Read multiple source files at once

### Documentation Maintenance

When you make significant changes, update the relevant context docs:

1. **After adding a feature:** Add a CHANGELOG.md entry
2. **After changing architecture:** Update the relevant architecture doc
3. **After changing build config:** Update BUILD_SYSTEM.md
4. **After adding tests:** Verify TESTING_GUIDE.md is still accurate

**CHANGELOG entry format:**
```markdown
## [YYYY-MM-DD] — Brief Description

### Overview
One sentence summary.

### Changes
- Bullet list of what changed
```

---

## Context Organization

```
FastEdge-sdk-js/
├── CLAUDE.md                              ← YOU ARE HERE
├── context/
│   ├── CONTEXT_INDEX.md                   ← Read first (discovery hub)
│   ├── PROJECT_OVERVIEW.md                ← New to codebase? Start here
│   ├── CHANGELOG.md                       ← Search with grep
│   ├── architecture/
│   │   ├── COMPONENTIZE_PIPELINE.md       ← JS→WASM pipeline (4 stages)
│   │   └── RUNTIME_ARCHITECTURE.md        ← StarlingMonkey, builtins, WIT
│   └── development/
│       ├── BUILD_SYSTEM.md                ← esbuild, TypeScript, path aliases
│       └── TESTING_GUIDE.md               ← Jest setup, test organization
├── src/                                   ← TypeScript source
│   ├── cli/                               ← 3 CLI tools
│   ├── componentize/                      ← Compilation pipeline
│   ├── server/static-assets/              ← Static site support
│   └── utils/                             ← Shared utilities
├── runtime/                               ← StarlingMonkey + builtins (C++/Rust)
├── types/                                 ← TypeScript declarations (public API)
├── examples/                              ← 13 standalone example apps
├── github-pages/                          ← Astro docs site (GitHub Pages)
├── docs/                                  ← Pipeline docs (planned)
├── esbuild/                               ← Build scripts
├── config/                                ← Jest + ESLint config
├── integration-tests/                     ← CLI integration tests
└── compiler/                              ← Docker build environment
```

---

## Search Tips

**Find pipeline code:**
```bash
grep -r "componentize" src/
grep -r "precompile" src/componentize/
```

**Find runtime builtins:**
```bash
grep -r "add_builtin" runtime/fastedge/
grep -r "INIT_ONLY" runtime/
```

**Find test files:**
```bash
find src/ -name "*.test.ts"
find integration-tests/ -name "*.test.*"
```

**Find path alias usage:**
```bash
grep -r "~componentize/" src/
grep -r "~utils/" src/
```

**Find CLI argument definitions:**
```bash
grep -r "arg(" src/cli/
```

---

## Quick Reference

**Tech Stack:** TypeScript, esbuild, Jest, StarlingMonkey (SpiderMonkey), Wizer, JCO
**Package:** `@gcoredev/fastedge-sdk-js` v2.1.0
**Node:** >= 20, pnpm >= 10
**License:** Apache-2.0

**Common Commands:**

| Command | Purpose |
|---------|---------|
| `pnpm run build:js` | Build CLI + libs + types (no runtime) |
| `pnpm run build:dev` | Full build including runtime (slow) |
| `pnpm run test:unit:dev` | Fast unit tests |
| `pnpm run test:unit` | Unit + slow tests |
| `pnpm run test:integration` | Integration tests |
| `pnpm run typecheck` | Type checking only |
| `pnpm run lint` | ESLint |
| `pnpm run generate:wit-world` | Regenerate WIT bindings |

---

## Summary

1. Read `context/CONTEXT_INDEX.md` first
2. Use the decision tree to find relevant docs
3. Read only what you need for your current task
4. Use grep for CHANGELOG and large files
5. Update context docs after significant changes
6. Use TaskCreate for multi-step work
