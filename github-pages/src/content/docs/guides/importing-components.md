---
title: Importing Wasm components
description: Call code written in Rust, Go or other languages from a FastEdge JS app.
---

`fastedge-build` can link WebAssembly components into your app. You import a component's functions
by the name of its WIT interface, like a JS module, and call them directly:

```ts
import { dimensions, resize } from 'example:image/thumbnail';
```

Use a component when the code you need exists in another language, or when a hot path needs native
speed. For anything JavaScript already does well, plain JavaScript is simpler.

:::note[Requires]

`@gcoredev/fastedge-sdk-js` 2.7.0 or later.

:::

### 1. The interface

A component describes its functions and types in WIT. This one makes image thumbnails:

```wit
package example:image;

interface thumbnail {
  enum format { jpeg, png }
  record size { width: u32, height: u32 }
  record options { max-width: u32, format: format }

  dimensions: func(image: list<u8>) -> result<size, string>;
  resize: func(image: list<u8>, options: options) -> result<list<u8>, string>;
}

world thumbnail-component {
  export thumbnail;
}
```

The component itself is built from any language with Component Model support, for example Rust with
`wit-bindgen` and the `wasm32-wasip2` target. The result is a `.wasm` file.

### 2. The build config

Map each interface your app imports to the component file that exports it:

```js
// .fastedge/build-config.js
export const config = {
  type: 'http',
  entryPoint: './src/index.ts',
  wasmOutput: './dist/app.wasm',
  tsConfigPath: './tsconfig.json',
  components: {
    'example:image/thumbnail': './thumbnail.wasm',
  },
};
```

Or on the command line, once per interface:

```sh
npx fastedge-build -i src/index.ts -o dist/app.wasm \
  --component example:image/thumbnail=./thumbnail.wasm
```

The output is a single `.wasm` with the component inside, deployed like any other app.

### 3. Types

The build writes `fastedge-components.d.ts` next to your entry file, with TypeScript declarations
for every imported interface, and type-checks your app against them. Add it to `.gitignore`: each
build with components rewrites it, and a build without components deletes it (a hand-written file of
the same name is left alone).

| WIT                 | JS / TypeScript                                               |
| ------------------- | ------------------------------------------------------------- |
| `list<u8>`          | `Uint8Array`                                                  |
| `u32`, `s32`, `f64` | `number`                                                      |
| `u64`, `s64`        | `bigint`                                                      |
| `string`            | `string`                                                      |
| `record`            | object, with camelCase field names (`max-width` → `maxWidth`) |
| `enum`              | string union (`'jpeg' \| 'png'`)                              |
| `option<T>`         | `T \| undefined`                                              |
| `result<T, E>`      | returns `T`; an error is thrown, with `E` in `error.payload`  |
| `resource`          | class                                                         |

### 4. Calling it

Calls are synchronous. This app resizes an image sent in the request body:

```ts
import { dimensions, resize } from 'example:image/thumbnail';

async function handle(request: Request): Promise<Response> {
  const bytes = new Uint8Array(await request.arrayBuffer());
  try {
    const { width, height } = dimensions(bytes);
    if (width * height > 500_000) {
      return new Response('Image too large', { status: 413 });
    }
    const thumbnail = resize(bytes, { maxWidth: 320, format: 'jpeg' });
    return new Response(thumbnail, { headers: { 'content-type': 'image/jpeg' } });
  } catch (error) {
    // A WIT `result` error is thrown, with the component's message in `payload`
    return new Response(`Cannot read image: ${(error as { payload: string }).payload}`, {
      status: 415,
    });
  }
}

addEventListener('fetch', (event: FetchEvent) => event.respondWith(handle(event.request)));
```

### Limits

Each request runs a fresh instance of your app, so the work a component does counts against every
request's time and memory limits. Check input sizes before expensive work, as the example does with
`dimensions()` before `resize()`.

A component may only import what FastEdge provides: WASI 0.2 and `gcore:` interfaces. Outgoing
HTTP requests from a component go through FastEdge, like `fetch()`. The build fails if a component
needs anything else.

### Full example

The [component imports example](https://github.com/G-Core/FastEdge-sdk-js/tree/main/examples/component-imports/)
serves images and their thumbnails, with the Rust source of the component.
