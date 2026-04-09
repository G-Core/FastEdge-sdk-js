# Plugin Source Contract — Naming Conventions

This document describes the naming and structure conventions for `manifest.json` in this repo. These rules ensure the sync-reference-docs pipeline correctly maps source files to plugin reference docs and intent skills.

## Reference File Structure

Reference files in the plugin repo are organized by app_type:

```
plugins/gcore-fastedge/skills/
  scaffold/reference/
    http/                     # HTTP app blueprints
      base-ts.md              # Base skeleton
      kv-store-ts.md          # Feature blueprint
    cdn/                      # CDN app blueprints (future)
    build-cli.md              # Cross-cutting (no subfolder)
  fastedge-docs/reference/
    http/                     # HTTP app example patterns
      examples-kv-store-js.md
    cdn/                      # CDN app example patterns (future)
    sdk-reference-js.md       # Cross-cutting (no subfolder)
```

## File Naming Convention

**`{concept}-{lang}.md`** — concept first, language last. The subfolder provides the app_type context.

| Type | Pattern | Example |
|---|---|---|
| Base skeleton | `{appType}/base-{lang}.md` | `http/base-ts.md` |
| Feature blueprint | `{appType}/{concept}-{lang}.md` | `http/kv-store-ts.md` |
| Docs pattern | `{appType}/examples-{concept}-{lang}.md` | `http/examples-kv-store-js.md` |
| Cross-cutting SDK ref | `sdk-reference-{lang}.md` | `sdk-reference-js.md` |

## Manifest target_mapping Rules

1. **reference_file** paths must include the `http/` or `cdn/` subfolder for app_type-specific content
2. **section** should be `null` for all entries (each file is owned by one repo — no splicing)
3. **Dual-intent pattern**: each example gets two entries with the same `files` array:
   - `{name}-blueprint` → `scaffold/reference/{appType}/{concept}-{lang}.md`
   - `{name}-pattern` → `fastedge-docs/reference/{appType}/examples-{concept}-{lang}.md`

## Intent File Matching

The pipeline resolves intent files by extracting the path suffix after `reference/` from the `reference_file` path. It looks for that same relative path inside the plugin's intent directory for this repo.

Example:
- `reference_file`: `plugins/.../scaffold/reference/http/kv-store-ts.md`
- Path suffix: `http/kv-store-ts.md`
- Intent lookup: `agent-intent-skills/fastedge-sdk-js/http/kv-store-ts.md`

## When Adding New Examples

1. Add source entries (paired `-blueprint` and `-pattern`) to `manifest.json`
2. Add target_mapping entries pointing to `{appType}/{concept}-{lang}.md` paths
3. Request intent files be created in `fastedge-plugin` repo (or create via PR):
   - `agent-intent-skills/fastedge-sdk-js/{appType}/{concept}-{lang}.md` (scaffold)
   - `agent-intent-skills/fastedge-sdk-js/{appType}/examples-{concept}-{lang}.md` (docs)
   - Each should reference `../_scaffold-blueprint-base.md` or `../_docs-pattern-base.md`
4. Create placeholder reference files at the target paths in the plugin repo
