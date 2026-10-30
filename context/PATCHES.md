# StarlingMonkey Patches

The `runtime/StarlingMonkey` submodule is pinned to the vanilla upstream tag
**`starlingmonkey-v0.4.0`** (`d7283bb`, 2026-10-26). **No patches are applied.**

All four patches previously carried on `godronus/gcore/integration` (on top of `0.3.0`) are
upstream as of v0.4.0 (verified: every line they added is present in the tag):

| Former fork commit | Upstream |
|---|---|
| `db26865` Response.clone — full clone isolation via cloneForBranch2 tee | [#312](https://github.com/bytecodealliance/StarlingMonkey/pull/312) (`5c671dd`) |
| `702d7a4` body.blob() sets Blob.type from Content-Type | [#313](https://github.com/bytecodealliance/StarlingMonkey/pull/313) (`04721e3`) |
| `c0d7f79` maybe_stream_body does not bypass JS Streams when cloned | part of #312 |
| `4dc05f3` WPT expectations for mime-type (test baseline only) | superseded by upstream's WPT update (#326) |

To bump: check out the new upstream tag in the submodule, rebuild, run the checks below, commit the
new submodule SHA. If a patch is ever needed again, carry it on a fork branch and use the procedure
below.

Note: v0.4.0 moved its WPT tag. If the configure step fails with "Failed to checkout tag
epochs/daily/…", the git-ignored WPT clone under `runtime/fastedge/deps/wpt-source` has local
changes (file-mode flips, stray `pnpm-lock.yaml`); `git reset --hard && git clean -fd` inside it and
rebuild.

---

## Rebase procedure (only if patches are carried again)

```bash
cd runtime/StarlingMonkey

# 1. Fetch the new upstream tag
git fetch origin

# 2. Rebase our integration branch onto the new release tag
git checkout gcore/integration
git rebase vX.Y.Z        # replace with new tag, e.g. v0.4.0

# 3. Resolve any conflicts, then:
git push godronus gcore/integration --force-with-lease

# 4. Back in FastEdge-sdk-js, stage the new submodule SHA
cd ../..
git add runtime/StarlingMonkey
git commit -m "chore(runtime): bump StarlingMonkey to vX.Y.Z + gcore patches"
```

5. The engine also carries ComponentizeJS's `embedding` builtin
   (`runtime/fastedge/builtins/embedding/`), paired with `vendor/splicer/`. Rebuild the engine and
   run the component-imports checks; if it no longer compiles or splices, move both to the
   ComponentizeJS release matching the new StarlingMonkey — see
   `development/VENDORED_TOOLS.md`.

## Retiring a patch

When an upstream PR merges, remove the corresponding entry from this file and
drop the commit from `gcore/integration` during the next rebase:

```bash
git rebase -i vX.Y.Z   # drop the line for the merged commit
```

Also delete any prod-invocation test guard that was added for the patch:

- `integration-tests/test-application/handlers/<patch>.ts`
- `integration-tests/test-application/checks/<patch>.ts`
- Any helper handler the guard relies on (e.g. a source route it fetches)
- The route constant(s) in `integration-tests/test-application/routes.ts`
- The import(s) + array entries in `integration-tests/test-application/test-app.ts`

## Current test guards

None. The Response.clone guard (`handlers/response-clone.ts`, `checks/response-clone.ts`,
`handlers/multi-chunk-source.ts`) is kept as a permanent regression test now that #312 is
upstream (validated on the preprod edge with v0.4.0, 2026-10-27); it is no longer a patch guard.
