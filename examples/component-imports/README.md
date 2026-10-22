[← Back to examples](../README.md)

# Component Imports — Image Thumbnails

Imports a Wasm component by its WIT interface and calls it like a JS module. The component,
`thumbnail.wasm`, is written in Rust with the [`image`](https://crates.io/crates/image) crate. The
app serves the images in `images/` and, with `?w=<width>`, a thumbnail made by the component.

```ts
import { dimensions, resize } from 'example:image/thumbnail';
```

## Why a component

The FastEdge JS runtime has no image APIs, and image codecs written in JS are slow. A component lets
the app use a mature library written in another language, compiled to Wasm and called like a JS
function. Use one when a library or code you need exists in another language, or when a hot path
needs native speed. For anything JS already does well, plain JS is simpler.

## Behaviour

| Request                             | Response                                 |
| ----------------------------------- | ---------------------------------------- |
| `GET /kev.jpeg`                     | `200` the original image                 |
| `GET /kev.jpeg?w=320`               | `200` a JPEG thumbnail up to 320 px wide |
| `GET /kev.jpeg?w=160&format=png`    | `200` a PNG thumbnail                    |
| `?w=` not a whole number            | `400`                                    |
| Image over `MAX_PIXELS`             | `413`, without decoding it               |
| Not an image the component can read | `415` with the component's error message |
| Not in `images/`                    | `404`                                    |

`w` is clamped to 16–800 px, and images are never enlarged.

## How it fits together

```
component/wit/thumbnail.wit   the interface: types and functions (WIT)
component/src/lib.rs          its implementation in Rust
component/build.sh            builds thumbnail.wasm (committed)
.fastedge/build-config.js     maps the interface to the component file
src/index.ts                  imports the interface like a JS module
```

`.fastedge/build-config.js` maps the interface to the component:

```js
components: {
  'example:image/thumbnail': './thumbnail.wasm',
},
```

`fastedge-build` reads the interface from the component, generates the bindings between JS and the
component, and composes the component into the output: `dist/component-imports.wasm` is a single
binary. It also writes `src/fastedge-components.d.ts` with TypeScript declarations for the import,
before type-checking, so a call with the wrong types fails the build.

The same build from the command line:

```sh
fastedge-build -i src/index.ts -o dist/component-imports.wasm -t tsconfig.json \
  --component example:image/thumbnail=./thumbnail.wasm
```

The images are embedded in the binary as static assets (`npm run create-images-manifest`, as in the
[static-assets](../static-assets/) example). That keeps the example self-contained; a real image
service would `fetch()` the original from an origin or storage and pass its bytes to the same
component calls.

## WIT types in JS

| WIT (`thumbnail.wit`)             | JS / TypeScript                                            |
| --------------------------------- | ---------------------------------------------------------- |
| `list<u8>`                        | `Uint8Array`                                               |
| `u32`                             | `number`                                                   |
| `record options { max-width, … }` | object `{ maxWidth, … }` (kebab-case becomes camelCase)    |
| `enum format { jpeg, png }`       | `'jpeg' \| 'png'`                                          |
| `result<size, string>`            | `size`; an error is **thrown**, message in `error.payload` |

## Time and memory limits

A request has a time and memory budget; on the free plan, 100 ms and 52 MB. Decoding is the costly
step, and its cost grows with the number of pixels. Measured on the edge:

| Image                     | Decode      | Whole component call | Memory |
| ------------------------- | ----------- | -------------------- | ------ |
| 612×640 JPEG (`kev.jpeg`) | ~10 ms      | ~20–30 ms            | 3 MB   |
| 1200×900 JPEG             | ~45–60 ms   | over 60 ms           | 9 MB   |
| 4000×3000 JPEG (12 MP)    | ~530–690 ms | over 700 ms          | 71 MB  |

So the app checks the size with `dimensions()`, which reads only the image header, and rejects
anything over `MAX_PIXELS` (0.5 MP) before decoding. Raise it only on a plan with a larger budget.
Progressive JPEGs decode about 3× slower than baseline ones; save images as baseline.

The component copies the image into its own memory for each call, so the bytes are held twice while
it runs. That is small next to the decoded pixels (3 bytes per pixel for a JPEG).

## Writing a component in another language

Any language that builds Wasm components can implement the interface, for example Go (TinyGo), C/C++
(wit-bindgen) or Python (componentize-py). The component may only import what FastEdge provides:
WASI 0.2 and `gcore:` interfaces. The build fails otherwise.

## Rebuilding the component

`thumbnail.wasm` is committed, so `npm run build` needs no Rust. After changing `component/`,
rebuild it with a Rust toolchain:

```sh
rustup target add wasm32-wasip2
npm run build:component
npm run build
```
