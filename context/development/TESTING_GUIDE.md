# Testing Guide

## Test Framework

- **Jest** v29 with `babel-jest` transform
- **Config:** `config/jest/jest.config.js`
- **Babel:** `@babel/preset-env` + `@babel/preset-typescript`
- **Environment:** Node.js

## Running Tests

| Command | Purpose |
|---------|---------|
| `pnpm run test:unit:dev` | Unit tests (fast — excludes slow tests) |
| `pnpm run test:unit` | Unit tests + slow tests (`RUN_SLOW_TESTS=true`) |
| `pnpm run test:integration` | Integration tests only |
| `pnpm run test:solo -- <path>` | Run a specific test file |

All test commands use `NODE_ENV=test` and the shared Jest config.

## Test Organization

### Unit Tests

Co-located with source in `src/**/__tests__/*.test.ts`:

```
src/
├── componentize/
│   └── __tests__/
│       ├── add-wasm-metadata.test.ts
│       ├── componentize.test.ts
│       └── get-js-input.test.ts
├── utils/
│   └── __tests__/
│       ├── color-log.test.ts
│       ├── config-helpers.test.ts
│       ├── content-types.test.ts
│       ├── deep-copy.test.ts
│       ├── file-info.test.ts
│       ├── file-system.test.ts
│       └── input-path-verification.test.ts
└── server/static-assets/
    └── (multiple __tests__/ dirs)
        ├── asset-cache.test.ts
        ├── create-manifest.test.ts
        ├── create-static-server.test.ts
        ├── headers.test.ts
        ├── static-server.test.ts
        └── ...
```

### Integration Tests

Located in `integration-tests/`:

```
integration-tests/
├── fastedge-build.test.js    — CLI argument parsing + build modes
├── fastedge-assets.test.js   — Asset manifest CLI
├── generates-output.test.js  — Full build produces valid WASM
├── test-application/         — Fixture app for build tests
└── test-files/               — Test fixture files
```

Integration tests exercise the full CLI tools end-to-end using `@gmrchk/cli-testing-library`.

### Mocks

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

1. **Follow the co-located pattern** — put `__tests__/` next to the source file
2. **Import from `@jest/globals`** for test functions
3. **Use `__mocks__/`** for module-level mocks
4. **Guard slow tests** with `process.env.RUN_SLOW_TESTS` check if appropriate
5. **Integration tests** go in `integration-tests/` and test full CLI output
