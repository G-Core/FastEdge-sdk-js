---
title: Compiling WebAssembly
description: How to compile wasm using FastEdge-sdk-js
---

:::caution[Install FastEdge-sdk-js first]

:::

There easiest way to build your first wasm binary:

### fastedge-build

Using the command line interface:

```sh
npx fastedge-build <input-path> <output-path>
```

- **\<input-path\>** is the entrypoint file of your javascript application. (`src/index.js`)
- **\<output-path\>** is the name of your final wasm. (e.g. `dist/main.wasm`)

This would take your `index.js` entrypoint file and compile it into a runtime `wasm` ready for
loading on FastEdge Compute.

Under the hood it uses
<a href='https://esbuild.github.io/' target='_blank' rel='noopener noreferrer'>esbuild</a> to
compile your `index.js` file before compiling it into a binary.wasm. This allows you to include
multiple files from the /src folder and import them as ES modules, `fastedge-build` will bundle them
on your behalf.
