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

## `Response.clone()` — partial: materialisation fixed, tee chunk independence broken

**Status:** Partially implemented in the `gcore/integration` StarlingMonkey branch
(as of 2026-06-08). `clone(): Response` is declared in `types/globals.d.ts` and
calling `.clone()` no longer throws. Reading both branches via `.text()` works
correctly. See `context/PATCHES.md` for the upstream PR status.

**Known remaining bug — tee shares chunk buffers:** Reading either clone branch
via `getReader()` and mutating the returned `Uint8Array` chunks corrupts the
other branch's data. The tee implementation enqueues the same `Uint8Array`
reference (or a view into the same `ArrayBuffer`) to both branches rather than
cloning each chunk. This affects both constructed responses and incoming `fetch()`
responses. Confirmed by the prod-invocation mutation guard tests (tests 2 and 4
in `integration-tests/test-application/handlers/response-clone.ts`).

**Readable byte stream tee** ([spec §8.2](https://streams.spec.whatwg.org/#abstract-opdef-readablebytestreamtee))
requires cloning each chunk before enqueueing to the second branch. This is a
separate issue from PR #312 and needs its own upstream fix.

**Do not release until** the prod-invocation `Response.clone` check passes
(currently fails on `constructedReader` and `incomingReader` mutation assertions).
See the removal checklist in `context/PATCHES.md`.

**Historical note:** PR #312 fixed the materialisation: an incoming `Response`
(result of `fetch()`) is backed by a host `HttpIncomingBody` handle that the
runtime fast-forwards directly to the outgoing body without materialising a JS
`ReadableStream`. Cloning requires reifying it into a tee-able stream. That part
works. The remaining bug is in the tee algorithm itself.

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
