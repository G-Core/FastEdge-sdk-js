# Quickstart

Get a FastEdge JavaScript application built and ready for deployment in minutes.

## Prerequisites

- Node.js >= 20
- npm, yarn, or pnpm

## Installation

```bash
npm install --save-dev @gcoredev/fastedge-sdk-js
```

## Option 1: Scaffold with fastedge-init

The fastest way to start a new project:

```bash
npx fastedge-init
```

This interactive wizard will:
1. Ask what you're building: **HTTP event handler** or **Static website**
2. Create a `.fastedge/` directory with build configuration
3. Generate a `build-config.js` file

Then build:

```bash
npx fastedge-build --config .fastedge/build-config.js
```

## Option 2: Build Directly

For an existing JavaScript file:

```bash
npx fastedge-build src/index.js output.wasm
```

## Write Your First App

Create `src/index.js`:

```js
async function handler(event) {
  const request = event.request;
  const url = new URL(request.url);

  return new Response(`Hello from FastEdge! You requested: ${url.pathname}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(handler(event));
});
```

Build it:

```bash
npx fastedge-build src/index.js app.wasm
```

The output `app.wasm` is a WebAssembly component ready for deployment on the FastEdge platform.

## Using Environment Variables

```js
import { getEnv } from 'fastedge::env';

addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const apiKey = getEnv('API_KEY');
    return new Response(`API key exists: ${apiKey !== null}`);
  })());
});
```

## Using Secrets

```js
import { getSecret } from 'fastedge::secret';

addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const secret = getSecret('MY_SECRET');
    // Use the secret value securely
    return new Response('OK');
  })());
});
```

## Using KV Store

```js
import { KvStore } from 'fastedge::kv';

addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const store = KvStore.open('my-store');
    const value = store.get('my-key');

    if (value) {
      const text = new TextDecoder().decode(value);
      return new Response(text);
    }

    return new Response('Key not found', { status: 404 });
  })());
});
```

## Next Steps

- [fastedge-build CLI](BUILD_CLI.md) — build options and configuration
- [fastedge-init CLI](INIT_CLI.md) — project scaffolding details
- [Static Sites](STATIC_SITES.md) — serve static websites
- [SDK Runtime API](SDK_API.md) — full API reference
- [Deploy your app](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)

## See Also

- [INDEX](INDEX.md) — documentation overview
- [Examples](https://github.com/G-Core/FastEdge-sdk-js/tree/main/examples) — real-world patterns
