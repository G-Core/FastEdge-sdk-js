# Known Runtime Limitations

Confirmed gaps in the StarlingMonkey runtime as it ships in this SDK. These are
**negative findings** — behaviors that look like they should work (standard Web
APIs, types that nearly exist) but do **not** on FastEdge today.

Use this file when a user reports "X is in the types / spec but throws at runtime"
or asks "does FastEdge support X?". For *planned* work and unverified items, see
`ENHANCEMENTS.md` and the "Known Issues / Future Work" section of `CONTEXT_INDEX.md`.

> StarlingMonkey is a git submodule: `runtime/StarlingMonkey` →
> `github.com/bytecodealliance/StarlingMonkey`. The pinned revision determines
> which builtins exist. When the pin moves, re-verify the items below.

---

## `Response.clone()` — ~~not implemented~~ implemented via gcore patch

**Status:** Implemented in the `gcore/integration` StarlingMonkey branch (as of
2026-06-08). `clone(): Response` is now declared on the `Response` interface in
`types/globals.d.ts`. See `context/PATCHES.md` for the upstream PR status.

**When the upstream PR merges** ([PR #312](https://github.com/bytecodealliance/StarlingMonkey/pull/312))
and the submodule is rebased onto a release containing it, remove the
prod-invocation test guard per the checklist in `context/PATCHES.md`.

**Historical note:** The implementation was non-trivial because an incoming
`Response` (result of `fetch()`) is backed by a host `HttpIncomingBody` handle
that the runtime fast-forwards directly to the outgoing body without materialising
a JS `ReadableStream`. Cloning requires reifying it into a tee-able stream and
giving up that fast path. PR #312 solves this by materialising the stream on
clone.

---

## `Response.error()` — not implemented

**Status:** Not supported. Also commented out in the same `types/globals.d.ts`
block (`error(): Response;  // static`).

**Symptom:** `Response.error()` (the static factory returning a network-error
response) is unavailable.

**Why:** Same root cause — the static method is not registered on `Response` in
the StarlingMonkey fetch builtin. No dedicated upstream issue; track alongside the
general fetch-builtin completeness work.

---

## Adding a new limitation here

1. Confirm it is a *runtime* gap (grep the relevant builtin in
   `runtime/StarlingMonkey/builtins/` — absence of the method/symbol).
2. Capture the **why** and any **upstream issue/PR** links.
3. Note the **workaround** and the **uncomment/verify** steps for when it lands.
4. Keep this file a single-sitting read — link out to source rather than
   inlining large excerpts.
