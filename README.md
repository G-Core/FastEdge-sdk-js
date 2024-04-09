# FastEdge JS SDK

This is the Javascript SDK for building Javascript applications ready for deploying on FastEdge.

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

Under the hood it uses esbuild to compile your `index.js` file before compiling into a wasm.

So including a bunch of files into the /dist folder and importing as es modules will work.

### componentize.js

This is a JS function, allowing you to build your runtime wasm within the context of a Javascript
config file.

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
