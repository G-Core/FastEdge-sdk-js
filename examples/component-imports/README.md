[← Back to examples](../README.md)

# Component Imports — URL Guard

Imports a Wasm component by its WIT interface and calls it like a JS module. The component,
`urlguard.wasm`, is a set of URL attack patterns compiled ahead of time by
[regexped](https://github.com/qrdl/regexped) into linear-time matchers. The app scans each
request's path and query and returns **403** when a pattern matches.

```js
import { scanUrl } from 'regexped:urlguard/sets';
```

## How it works

`.fastedge/build-config.js` maps the interface to the component file:

```js
components: {
  'regexped:urlguard/sets': './urlguard.wasm',
},
```

`fastedge-build` reads the interface's types from the component, generates the JS bindings
for the import, and composes the component into the output, so `dist/component-imports.wasm`
is a single binary with no extra imports. It also writes `src/fastedge-components.d.ts` with
TypeScript declarations for the import.

The same build from the command line:

```sh
fastedge-build -i src/index.js -o dist/component-imports.wasm \
  --component regexped:urlguard/sets=./urlguard.wasm
```

A component may only import what FastEdge provides (WASI 0.2 and `gcore:` interfaces); the
build fails otherwise.

## Behaviour

| Request | Response |
| --- | --- |
| No pattern matches | `200` `ok` |
| A pattern matches | `403` `{ "blocked": "<pattern name>" }` |
| The matcher fails | `500` with the component's error code |

## Why a component instead of `RegExp`

Regex patterns run in an interpreter on FastEdge, and some backtrack: a crafted input can
take seconds to scan. regexped matchers run in linear time, so a hostile input costs
milliseconds at most.

## Rebuilding the component

`urlguard.wasm` is committed, so `npm run build` works without extra tools. After editing
`regexped.yaml`, rebuild it with Docker:

```sh
npm run build:component
```

Keep `PATTERNS` in `src/index.js` in the same order as `regexped.yaml`.
