# FastEdge React Application

A React + Vite frontend served from a FastEdge application using Hono.

This starter-kit provides backend route functionality examples for Users.

## Build

```bash
npm install
npm run build
```

This will create `./wasm/react-app.wasm` ready for deployment.

## Deploy

Use the FastEdge CLI or API to deploy the generated wasm binary file.

## Development

```bash
npm run dev
```

This will run the Vite server for developing your React front-end with HMR as well as a Hono server
to provide the `/api` routes.

## How it works

The React site is broken down into 2 main sections:

├── /fastedge-server \
└── /src

- /fastedge-server: \
  This is the backend for the React site, it is the FastEdge application that serves the React site
  and handles any backend API routes, \
  it is using [Hono](https://hono.dev/) to handle all incoming requests.

- /src: \
  This is the React front end code. This gets built using Vite's React tooling.

During the build process it takes all of your front-end code and embeds it into the wasm binary. \
This allows the FastEdge static-server to serve your React site to the browser
[(read more)](https://g-core.github.io/FastEdge-sdk-js/guides/creating-a-static-manifest/).

Apart from serving your React site, this example also provides some back-end routes: `/api/users`

During development the `fastedge-server` is replaced with a
[dev-server](./fastedge-server/dev-server.ts). This makes for a faster development cycle.

> **Note** \
> This dev-server is not a direct replacement for testing within the FastEdge environment. \
> @Hono/node-server does not have the same limitations or functionality as FastEdge. \
> This is purely provided as an example of how to achieve this working environment.
