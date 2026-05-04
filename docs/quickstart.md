# Quickstart

Get a FastEdge JavaScript application built and ready for deployment.

## Prerequisites

- Node.js `>=22` (see `engines.node` in `package.json`)
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

For an existing JavaScript or TypeScript file, pass input and output as positional arguments:

```bash
npx fastedge-build src/index.js output.wasm
```

Or using explicit flags:

```bash
npx fastedge-build --input src/index.ts --output app.wasm --tsconfig tsconfig.json
```

### fastedge-build CLI Flags

| Flag         | Alias | Type       | Description                     |
| ------------ | ----- | ---------- | ------------------------------- |
| `--input`    | `-i`  | `string`   | Entry point file                |
| `--output`   | `-o`  | `string`   | Output `.wasm` file path        |
| `--tsconfig` | `-t`  | `string`   | Path to `tsconfig.json`         |
| `--config`   | `-c`  | `string[]` | Path(s) to build config file(s) |
| `--version`  | `-v`  | `boolean`  | Print version                   |
| `--help`     | `-h`  | `boolean`  | Print help                      |

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

`getEnv` is only available during request processing, not at build-time initialization.

```js
/// <reference types="@gcoredev/fastedge-sdk-js" />
import { getEnv } from 'fastedge::env';

addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const apiKey = getEnv('API_KEY');
      if (apiKey === null) {
        return new Response('API_KEY not configured', { status: 500 });
      }
      return new Response(`API key exists: ${apiKey.length > 0}`);
    })(),
  );
});
```

**Signature:** `getEnv(name: string): string | null`

Returns `null` when the environment variable is not set.

## Using Secrets

`getSecret` and `getSecretEffectiveAt` are only available during request processing, not at build-time initialization.

```js
/// <reference types="@gcoredev/fastedge-sdk-js" />
import { getSecret } from 'fastedge::secret';

addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const token = getSecret('SECRET_TOKEN');
      // Use token to authenticate downstream requests
      return new Response('OK');
    })(),
  );
});
```

**Signatures:**

- `getSecret(name: string): string | null`
- `getSecretEffectiveAt(name: string, effectiveAt: number): string | null`

Both return `null` when the secret is not set.

## Using KV Store

```js
/// <reference types="@gcoredev/fastedge-sdk-js" />
import { KvStore } from 'fastedge::kv';

addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const store = KvStore.open('my-store');
      const entry = await store.getEntry('my-key');

      if (entry === null) {
        return new Response('Key not found', { status: 404 });
      }

      return new Response(await entry.text());
    })(),
  );
});
```

**Signatures:**

- `KvStore.open(name: string): KvStoreInstance`
- `KvStoreInstance.get(key: string): ArrayBuffer | null`
- `KvStoreInstance.getEntry(key: string): Promise<KvStoreEntry | null>`
- `KvStoreInstance.scan(pattern: string): Array<string>`
- `KvStoreInstance.zrangeByScore(key: string, min: number, max: number): Array<[ArrayBuffer, number]>`
- `KvStoreInstance.zrangeByScoreEntries(key: string, min: number, max: number): Promise<Array<[KvStoreEntry, number]>>`
- `KvStoreInstance.zscan(key: string, pattern: string): Array<[ArrayBuffer, number]>`
- `KvStoreInstance.zscanEntries(key: string, pattern: string): Promise<Array<[KvStoreEntry, number]>>`
- `KvStoreInstance.bfExists(key: string, value: string): boolean`

**`KvStoreEntry` methods:**

- `arrayBuffer(): Promise<ArrayBuffer>`
- `text(): Promise<string>`
- `json(): Promise<unknown>`

## Next Steps

- [fastedge-build CLI](BUILD_CLI.md) — build options and configuration
- [fastedge-init CLI](INIT_CLI.md) — project scaffolding details
- [Static Sites](STATIC_SITES.md) — serve static websites
- [SDK Runtime API](SDK_API.md) — full API reference
- [Deploy your app](https://gcore.com/docs/fastedge/getting-started/create-fastedge-apps#stage-2-deploy-an-app)

## See Also

- [INDEX](INDEX.md) — documentation overview
- [Examples](https://github.com/G-Core/FastEdge-sdk-js/tree/main/examples) — real-world patterns
