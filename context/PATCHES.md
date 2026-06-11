# StarlingMonkey Patches

The `runtime/StarlingMonkey` submodule is pinned to the tip of
`godronus/gcore/integration` rather than a vanilla upstream tag.

That branch is upstream `0.3.0` with the patches below cherry-picked on top.
When StarlingMonkey releases a new version, follow the **Rebase procedure**
below to carry the patches forward.

---

## Applied patches

### 1. `fix(fetch): Response.clone - full clone isolation via cloneForBranch2 tee`

| Field | Value |
|-------|-------|
| Commit on `gcore/integration` | `db26865` |
| Source branch | `godronus/feature/response-clone` |
| Upstream PR | https://github.com/bytecodealliance/StarlingMonkey/pull/312 |
| Status | Open — awaiting upstream review |

Single squashed commit implementing `Response.clone()`: eager `cloneForBranch2`
tee for body isolation, handle-based header cloning (preserves `Set-Cookie`,
avoids the immutable-headers throw), the `bodyUsed`/`ReadableStreamIsDisturbed`
fallback, and the accompanying WPT expectations.

### 2. `fix(fetch): body.blob() sets Blob.type from Content-Type header`

| Field | Value |
|-------|-------|
| Commit on `gcore/integration` | `702d7a4` |
| Source branch | `godronus/fix/blob-type` |
| Upstream issue | https://github.com/bytecodealliance/StarlingMonkey/issues/311 |
| Upstream PR | (PR opened from fork — link when available) |
| Status | Open — awaiting upstream review |

---

## Rebase procedure (when upstream releases a new version)

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

| Patch | Guard files | Remove when |
|-------|-------------|-------------|
| Response.clone() | `handlers/response-clone.ts` (tests 1–9), `checks/response-clone.ts`, `handlers/multi-chunk-source.ts` (multi-chunk source self-fetched by tests 7–9), `RESPONSE_CLONE` + `MULTI_CHUNK_SOURCE` in `routes.ts`, and both `test-app.ts` registrations | PR #312 merges and submodule is rebased |

The `response-clone` guard covers: basic clone + metadata (1), constructed getReader mutation guard (2), incoming `text()` (3) and getReader mutation guard (4), consumed/locked `TypeError` (5–6), host-backed multi-chunk mutation guard (7), cancel-one-branch (8), and read-header-then-clone (9, guards the Headers-immutable clone path).
