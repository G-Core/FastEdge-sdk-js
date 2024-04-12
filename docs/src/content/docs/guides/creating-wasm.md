---
title: Compiling WebAssembly
description: How to compile wasm using FastEdge-sdk-js
---

:::caution[Install FastEdge-sdk-js first]

:::

There are 2 ways to compile your code to WebAssembly. CLI or Componentize package:

### CLI

Using the command line interface:

```sh
npx componentize-cli <input-path> <output-path>
```

- **\<input-path\>** is the entrypoint file of your javascript application. (`src/index.js`)
- **\<output-path\>** is the name of your final wasm. (e.g. `dist/main.wasm`)

This would take your `index.js` entrypoint file and compile it into a runtime `wasm` ready for
loading on FastEdge Compute.

Under the hood it uses [esbuild](https://esbuild.github.io/) to compile your `index.js` file before
compiling it into a binary.wasm. This allows you to include multiple files from the /src folder and
import them as ES modules, `componentize-cli` will bundle them on your behalf.

### Componentize

Create a componentize build configuration file in your project:

```js title="wasm-build.config.js"
import { componentize } from "@gcoredev/fastedge-sdk-js"

await componentize("./src/index.js", "./dist/main.wasm", {
  debug = false,
  preBundleJSInput = true,
});
```

If you want to compile an already bundled entrypoint `index.js` using componentize is the preferred
method.

For instance if you are bundling your code using Webpack, you would then use this config.js with:

```js frame="none"
preBundleJSInput = false;
```

It will then just embed your provided code into a `wasm` without trying to interpret it again.
