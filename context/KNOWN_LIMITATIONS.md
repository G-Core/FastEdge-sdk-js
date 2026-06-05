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

## `Response.clone()` — not implemented

**Status:** Not supported by the runtime. Declared but **commented out** in
`types/globals.d.ts` (see the "Spec methods not implemented" block on the
`Response` interface).

**Symptom:** Calling `.clone()` on a `Response` (e.g. to read an upstream
`fetch()` body twice — log one copy while transforming another) is a runtime
error. There is no `clone` method on the `Response` prototype.

**Why:** It simply hasn't been finished and merged upstream — not a deep
technical impossibility.

- `Request.clone()` **is** implemented (`Request::clone`, registered in
  `Request::methods`). It works by calling `ReadableStreamTee()` to split the
  body into two independent streams.
- `Response` registers only `arrayBuffer / blob / formData / json / text` — there
  is **no** `Response::clone` symbol in
  `runtime/StarlingMonkey/builtins/web/fetch/request-response.cpp`.

**The Response-specific wrinkle:** An *incoming* `Response` (the result of a
`fetch()`) is backed by a host `HttpIncomingBody` handle. The runtime optimizes
this in `RequestOrResponse::maybe_stream_body` by **direct-forwarding** the host
body straight to the outgoing body via async host tasks — without ever
materializing a JS `ReadableStream`. That host body is a *single-consumer*
resource. Cloning requires reifying it into a tee-able JS stream and giving up
that fast path, which is what makes a fully spec-conformant implementation
non-trivial.

**Upstream tracking:**

| Ref | What | State |
|-----|------|-------|
| [Issue #125](https://github.com/bytecodealliance/StarlingMonkey/issues/125) | "Response.clone support" | Open — *"We support `Request.clone` but not `Response.clone`."* |
| [PR #178](https://github.com/bytecodealliance/StarlingMonkey/pull/178) | "Implement Response.clone" | **Open draft.** Adapts `Request.clone`; stalled on WPT conformance (only 6/21 `response-clone.any.js` cases passing). |
| [Issue #84](https://github.com/bytecodealliance/StarlingMonkey/issues/84) | "Request.clone() regression" | Closed — context that even the Request side has been fragile. |

**When fixed upstream:** Uncomment `prototype.clone(): Response;` in
`types/globals.d.ts`, bump the `runtime/StarlingMonkey` submodule pin, and verify
with a handler that clones a `fetch()` response and reads both copies to the same
bytes.

**Workaround today:** Read the body once (e.g. `await res.arrayBuffer()`) and
construct fresh `Response` objects from the buffered bytes when you need to use
the payload more than once.

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
