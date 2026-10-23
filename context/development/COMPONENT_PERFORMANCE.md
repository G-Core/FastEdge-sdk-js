# Component Imports: First-Call Performance

Read this when a user reports that calls into an imported Wasm component are slow, especially the
first call in a request, or before changing `GLUE_WARMUP` in `src/componentize/components.ts`.
Pipeline background: `architecture/COMPONENTIZE_PIPELINE.md` ("Component imports").

## Why the first call matters on FastEdge

FastEdge creates a fresh instance for every request (wasmtime pooling allocator, copy-on-write
memory from the Wizer snapshot; `FastEdge/fastedge-lib/crates/runtime/src/lib.rs`). So "first call"
means **the first call in every request**, not a one-off warm-up. Anything set up at request time
is paid on every request; anything set up at Wizer time is in the snapshot and costs nothing
unless its memory pages are touched.

## Where the cost comes from

The splicer's JS glue (lowering/lifting between JS values and the component) runs in its **own
global** (StarlingMonkey's initializer-script global), not the app's. SpiderMonkey creates
standard classes (`String.prototype`, typed arrays, `BigInt`, `Error`, ...) in a global lazily, the
first time something there uses them. Nothing in the glue touches most of them at Wizer time, so
without help each request rebuilds them on its first call. `GLUE_WARMUP` touches them at Wizer
time so they are in the snapshot. It is appended to the glue only in builds with components.

Cost of the warm-up: ~6.5 KB larger output (0.05%), no extra memory per request (the same objects
would be built anyway), nothing for requests that never call a component.

## Measured (calculator + regexped composed, fresh instance per request, fastedge-run)

| First call in a request | Before warm-up | With `GLUE_WARMUP` | Second call |
|---|---|---|---|
| Any import (typed arrays/DataView) | ~200 µs | ~20 µs | 4–10 µs |
| First string argument (`String`) | 150–220 µs | 25–60 µs | 10–13 µs |
| `u64`/`s64` (`BigInt`) | 33–42 µs | ~7 µs | 4–6 µs |
| `err` result (`Error`) | 87–145 µs | 60–100 µs | 16–20 µs |
| `u8`, `char`, `f64`, record, `option` | 5–25 µs | unchanged | 4–9 µs |
| `list<u8>` / `list<string>` | 24–80 µs | unchanged | 10–22 µs |

**Not fixable from the SDK side** (don't spend time re-trying):
- ~20 µs on the first call of any JS function — generic SpiderMonkey cost, also on builds
  without components.
- ~30 µs on the first `throw` in a request — also for plain JS throws.
- ~22 µs on the first list call — the component's own first memory allocation, inside the
  component. Components are plugged in after Wizer, so our snapshot can't include their state;
  a component author can pre-initialize their own component.

**Ruled out** (measured, no effect): compiling the initializer script eagerly
(`setForceFullParse()` in StarlingMonkey `run_initialization_script`); warming `TextEncoder`
`encode`/`encodeInto` or `TextDecoder`; warming `Array` (`push`, `isArray`), typed-array `.set()`,
`ArrayBuffer.prototype.slice`.

Built-ins the glue uses that are already set up at Wizer time: `Map`, `Symbol`,
`FinalizationRegistry` (top-level glue code). `TypeError` appears only on invalid input.

## Diagnosing a user's component

1. **Reproduce with timing inside the app.** Time the first and second call to each import in
   the same request, and return the numbers:
   ```js
   const time = (fn) => { const t0 = performance.now(); fn(); return (performance.now() - t0) * 1000; };
   addEventListener('fetch', (e) => {
     const t = { first: time(() => myImport(arg)), second: time(() => myImport(arg)) };
     e.respondWith(Response.json(t));
   });
   ```
   Build with `fastedge-build ... --component <iface>=<file>` and run ~20 requests with
   `@gcoredev/fastedge-test` (`createRunner(wasm)` + `runHttpRequest(runner, { path })`), taking
   the median. Each request is a fresh instance, as on the edge. Vary the call order: a cost that
   moves to whichever call is first is in the shared glue; one that stays with a call is specific.
2. **Get the glue for that component** (run from the SDK root, after `pnpm run build:js`):
   ```js
   // node dump-glue.mjs out.js <component.wasm>=<ns:pkg/iface> ...
   import { readFile, writeFile } from 'node:fs/promises';
   import { importWorld } from './vendor/component-tools/component-tools.js';
   import { splicer } from './vendor/splicer/spidermonkey-embedding-splicer.js';
   const [out, ...pairs] = process.argv.slice(2);
   const specs = pairs.map((p) => p.split('='));
   const binaries = await Promise.all(specs.map(([file]) => readFile(file)));
   const wit = importWorld(binaries, specs.map(([, iface]) => iface));
   const engine = new Uint8Array(await readFile('lib/fastedge-runtime.wasm'));
   const features = ['stdio', 'clocks', 'random', 'http', 'fetch-event'];
   const { jsBindings } = splicer.spliceBindings(engine, features, wit, undefined, 'app', false);
   await writeFile(out, jsBindings);
   ```
   List the built-ins used inside functions (top-level code already runs at Wizer time).
3. **Find the slow step.** Temporarily patch `spliceImports` in `src/componentize/components.ts`
   to transform the glue before it is written (e.g. load a module from an env var that
   `String.replace`s timestamps into the wrapper), rebuild with `pnpm run build:js`, and record
   `contentGlobal.performance.now()` between steps into `contentGlobal.__T`. `performance` does
   not exist on the glue's global; `contentGlobal` is the app's. Revert the hook afterwards.
4. **Try a warm-up line** in `GLUE_WARMUP` that touches the built-in the slow step uses, rebuild,
   re-measure. Keep it only if the first call drops; note the size change of the output.
5. Update the table above and `context/CHANGELOG.md`.

Re-check after a splicer update (`development/VENDORED_TOOLS.md`): new glue can use built-ins the
warm-up doesn't cover. Step 2 with a component using many WIT types shows them.
