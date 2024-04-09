# FastEdge JS SDK

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/G-Core/FastEdge-sdk-js/deploy.yaml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/t/G-Core/FastEdge-sdk-js)
![GitHub top language](https://img.shields.io/github/languages/top/G-Core/FastEdge-sdk-js)
![GitHub License](https://img.shields.io/github/license/G-Core/FastEdge-sdk-js)
![NPM Version](https://img.shields.io/npm/v/@gcoredev/fastedge-sdk-js)

This is the Javascript SDK for building Javascript applications ready for deploying on FastEdge.

## Table of Contents

- [FastEdge JS SDK](#fastedge-js-sdk)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
    - [Basic Javascript Example](#basic-javascript-example)
  - [How to compile](#how-to-compile)
    - [componentize-cli](#componentize-cli)
    - [componentize](#componentize)
      - [Options](#options)
  - [API Docs](#api-docs)

## Getting Started

Please read through the documentation provided by Gcore.

- FastEdge: [Overview](https://gcore.com/fastedge)
- Deploying an App:
  [Documentation](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)

## Usage

Required:

- Node v18 or higher

Setup:

- `npm install`

### Basic Javascript Example

```js
async function app(event) {
  const request = event.request;
  return new Response(`You made a request to ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
```

## How to compile

There are two methods to build your own javascript into a runtime wasm.

### componentize-cli

This is a command-line tool that allows you to provide the input js file and the output wasm file.

```sh
node ./componentize-cli.js dist/index.js dist/main.wasm

```

This would take your `index.js` entrypoint file and compile it into a runtime `wasm` ready for
loading on FastEdge Compute.

Under the hood it uses [esbuild](https://esbuild.github.io/) to compile your `index.js` file before
compiling into a wasm. This allows you to include multiple files into the /dist folder and import
them as ESM modules.

### componentize

This is a JS function provided by an NPM package, allowing you to build your runtime wasm within the
context of a Javascript config file / project.

```js
import { componentize } from "@gcoredev/fastedge-sdk-js"

await componentize("./dist/index.js", "./dist/main.wasm", {
  debug = false,
  preBundleJSInput = true,
});
```

If you want to include an already bundled entrypoint `index.js` this is the preferred method. For
instance if you want to bundle using Webpack.

You can then bundle your code into a single file and use this config.js with the
`preBundleJSInput = false`.

This will then just compile your provided code into `wasm` without trying to interpret it.

#### Options

- debug?: boolean

  - defaults to false
  - Enables a certain amount of logging during development

- preBundleJSInput?: boolean
  - defaults to true
  - During the build process we bundle your `index.js` file using esbuild. If you want to provide a
    pre-compiled js file from a different bundler. Set this to false.

## API Docs

🚧 Under Construction: Api docs online coming soon as well as Typescript typings.

For now there is some basic descriptions and examples in [api-basics](./docs/api-basics.md)
