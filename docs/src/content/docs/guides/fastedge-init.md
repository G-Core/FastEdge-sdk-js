---
title: Fastedge configuration
description: Using fastedge-init to create build configurations
---

Repeat builds or more complex build configuration is easiest using `config` files.

### fastedge-init

This is a command line tool that allows you to create `config` file starter templates for your
builds.

The simplest of these is just a configuration file that defines the **\<input-path\>** and
**\<output-path\>** for creating a wasm.

Using the command line interface:

```sh
npx fastedge-init
```

This will present you with a few menu options:

![Description of image](/FastEdge-sdk-js/fastedge-init-http.png)

Running this init command will create a `.fastedge` folder at the top level of your project
including the created `build-config.js` file.

```js
// .fastegde/build-config.js
const config = {
  type: 'http',
  input: 'src/index.js',
  output: '.fastedge/dist/main.wasm',
};

const serverConfig = {
  type: 'http',
};

export { config, serverConfig };
```

:::note[INFO]

To build a wasm using this default `config` run:

```sh
npx fastedge-build --config
```

:::
