# StarlingMonkey Patches

The `runtime/StarlingMonkey` submodule is pinned to the tip of
`godronus/gcore/integration` rather than a vanilla upstream tag.

That branch is upstream `0.3.0` with the patches below cherry-picked on top.
When StarlingMonkey releases a new version, follow the **Rebase procedure**
below to carry the patches forward.

---

## Applied patches

### 1. `feat(fetch): implement Response.clone()`

| Field | Value |
|-------|-------|
| Commit on `gcore/integration` | `65f6a6c` |
| Source branch | `godronus/feature/response-clone` |
| Upstream PR | https://github.com/bytecodealliance/StarlingMonkey/pull/312 |
| Status | Open — awaiting upstream review |

### 2. `test(wpt): update WPT expectations`

| Field | Value |
|-------|-------|
| Commit on `gcore/integration` | `8fc9b89` |
| Source branch | `godronus/feature/response-clone` |
| Upstream PR | https://github.com/bytecodealliance/StarlingMonkey/pull/312 |
| Status | Open — part of the Response.clone() PR |

### 3. `fix(fetch): body.blob() sets Blob.type from Content-Type header`

| Field | Value |
|-------|-------|
| Commit on `gcore/integration` | `84f5d52` |
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
- The route constant in `integration-tests/test-application/routes.ts`
- The import + array entry in `integration-tests/test-application/test-app.ts`

## Current test guards

| Patch | Guard files | Remove when |
|-------|-------------|-------------|
| Response.clone() (patches 1–2) | `handlers/response-clone.ts`, `checks/response-clone.ts` | PR #312 merges and submodule is rebased |
