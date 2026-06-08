# Testing Guide

## Test Framework

- **Jest** v29 with `babel-jest` transform
- **Config:** `config/jest/jest.config.js`
- **Babel:** `@babel/preset-env` + `@babel/preset-typescript`
- **Environment:** Node.js

## Running Tests

| Command | Purpose | When it runs |
|---------|---------|-------------|
| `pnpm run test:unit:dev` | Unit tests (fast — excludes slow tests) | Every PR |
| `pnpm run test:unit` | Unit tests + slow tests (`RUN_SLOW_TESTS=true`) | Every PR (CI) |
| `pnpm run test:integration` | CLI integration tests | Release builds |
| `pnpm run test:solo -- <path>` | Run a specific test file | Local |
| `pnpm test:app:build` | Build prod-invocation WASM app | Local / release builds |
| `pnpm test:app:check` | Run prod-invocation checks against a live URL | Local |

## Testing Layers

There are three distinct testing layers. Understanding which layer to use for a given task matters:

### 1. Unit Tests — toolchain correctness

Co-located with source in `src/**/__tests__/*.test.ts`. Test the TypeScript/JS build pipeline in Node.js with heavy mocking. **Do not test WASM runtime behaviour.**

```
src/
├── componentize/__tests__/   — build pipeline stages (mocked)
├── utils/__tests__/          — shared utilities
└── server/static-assets/     — static asset server logic
    └── (multiple __tests__/ dirs)
```

### 2. CLI Integration Tests — build tool correctness

Located in `integration-tests/` (3 test files). Test that `fastedge-build` and `fastedge-assets` CLIs accept/reject the right inputs and produce output. `generates-output.test.js` verifies the build emits a `.wasm` file but **does not execute it**.

```
integration-tests/
├── fastedge-build.test.js    — argument parsing, file validation, error handling
├── fastedge-assets.test.js   — asset manifest CLI
└── generates-output.test.js  — full build produces a .wasm file
```

### 3. Production Invocation Tests — runtime correctness

A real FastEdge WASM app deployed to live infrastructure during each release. The only layer that validates actual WASM runtime behaviour. See `integration-tests/test-application/README.md` for full details.

```
integration-tests/test-application/
├── test-app.ts          ← Hono entry point
├── routes.ts            ← single source of truth for route paths + test names
├── types.ts             ← shared TypeScript interfaces
├── handlers/            ← WASM handlers (fastedge:: imports, run in runtime)
├── checks/              ← Node.js check functions (run in CI / locally)
└── dist/                ← build artefacts (gitignored)
```

**Running locally:**
```bash
# Requires pnpm run build:js first
pnpm test:app:build
APP_URL=https://your-deployed-app.example.com pnpm test:app:check
```

**Adding a prod-invocation test:** see `integration-tests/test-application/README.md`.

## Mocks

Co-located in `src/**/__mocks__/` directories. Jest auto-discovers these for module mocking.

## Jest Configuration Details

**Path aliases** are mapped in the Jest config to match `tsconfig.json`:
```js
moduleNameMapper: {
  '^~componentize/(.*)$': '<rootDir>/src/componentize/$1',
  '^~utils/(.*)$': '<rootDir>/src/utils/$1',
  // ... etc
}
```

**Ignored paths:** `node_modules`, `dist`, `github-pages`, `runtime/StarlingMonkey/`, `runtime/fastedge/deps`

## Writing Tests

### Unit / CLI integration tests
1. **Follow the co-located pattern** — put `__tests__/` next to the source file
2. **Import from `@jest/globals`** for test functions
3. **Use `__mocks__/`** for module-level mocks
4. **Guard slow tests** with `process.env.RUN_SLOW_TESTS` check if appropriate
5. **CLI integration tests** go in `integration-tests/` and test full CLI output

### Production invocation tests
See `integration-tests/test-application/README.md` — adding/removing a test, the handler/check split, `routes.ts` as single source of truth, and the temporary test pattern.
