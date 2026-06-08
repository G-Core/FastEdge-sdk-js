# FastEdge SDK Test Application

## What this is

The production invocation test app — a real FastEdge WASM app deployed to live infrastructure during each SDK release to verify the runtime works end-to-end.

This is not a unit test suite. It validates that FastEdge host APIs (env vars, secrets, outbound fetch, request handling) and any patched runtime capabilities work correctly after a real deployment.

## Structure

```
test-application/
  test-app.ts          ← Hono entry point; registers all handlers
  routes.ts            ← Single source of truth for route paths and test names
  types.ts             ← Shared TypeScript interfaces (CheckContext, HandlerModule, CheckModule)
  handlers/            ← WASM handlers — run inside the FastEdge runtime
  checks/              ← Node.js check functions — run locally or in CI against a live URL
  dist/                ← build artefacts (gitignored)
    test-app.wasm      ← compiled WASM binary
    checks/*.js        ← compiled check modules for Node.js
```

Each test is a pair of files with matching names:

| Handler | Check | Route | What it tests |
|---------|-------|-------|---------------|
| `handlers/env.ts` | `checks/env.ts` | `GET /` | Env variable access |
| `handlers/outbound-fetch.ts` | `checks/outbound-fetch.ts` | `GET /fetch` | Outbound HTTP fetch |
| `handlers/secret.ts` | `checks/secret.ts` | `GET /secret` | Secret injection |
| `handlers/echo.ts` | `checks/echo.ts` | `POST /echo` | Request method/headers/body echo |
| `handlers/response-clone.ts` | `checks/response-clone.ts` | `GET /response-clone` | **[temporary]** `Response.clone()` |

## How CI uses this

1. `create-test-app.js` builds `test-app.ts` → `dist/test-app.wasm` via `fastedge-build`, then compiles `checks/*.ts` → `dist/checks/*.js` for Node.js
2. The WASM binary is deployed to live FastEdge infrastructure
3. `invoke-test-app.js` auto-discovers every module in `dist/checks/` and runs its `check()` function against the deployed URL
4. All checks must pass for the release to proceed

## Running locally

Requires a built SDK (`pnpm run build:js`) and the URL of an already-deployed FastEdge app.

```bash
# Build the WASM binary
pnpm test:app:build

# Run all checks against a deployed app
APP_URL=https://your-app.example.com pnpm test:app:check

# Override the expected BUILD_SHA (default: current git HEAD)
BUILD_SHA=abc123 APP_URL=https://your-app.example.com pnpm test:app:check
```

Local runs report all failures rather than stopping on the first, so you see the full picture in one pass.

## Adding a test

1. Add a constant to `routes.ts`:
   ```typescript
   export const MY_FEATURE = { name: 'my feature', route: '/my-feature' };
   ```

2. Create `handlers/my-feature.ts`:
   ```typescript
   import { MY_FEATURE } from '../routes.js';
   export const route = MY_FEATURE.route;
   export async function handler(req: Request): Promise<Response> { ... }
   ```

3. Create `checks/my-feature.ts`:
   ```typescript
   import { MY_FEATURE } from '../routes.js';
   import type { CheckContext } from '../types.js';
   export const name = MY_FEATURE.name;
   export async function check(appUrl: string, _ctx: CheckContext): Promise<void> { ... }
   ```

4. Register the handler in `test-app.ts` — import the module and add it to the `handlers` array.

The check is auto-discovered at runtime; no changes to the CI scripts are needed.

## Removing a test

1. Delete `handlers/feature.ts` and `checks/feature.ts`
2. Remove the import and array entry from `test-app.ts`
3. Remove the constant from `routes.ts`

## Temporary tests

Some tests exist only to guard against a specific regression until an upstream fix lands. Remove them once the upstream PR merges and the StarlingMonkey submodule is rebased onto a release that includes it.

| Test | Upstream fix | Remove when |
|------|-------------|-------------|
| `response-clone` | [PR #312](https://github.com/bytecodealliance/StarlingMonkey/pull/312) | PR merges and submodule is rebased |
