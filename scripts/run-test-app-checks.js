#!/usr/bin/env node
/* eslint-disable no-console */
// Compiles checks/*.ts and runs all check functions against a deployed app.
// Usage: APP_URL=https://your-app.example.com pnpm test:app:check
//        BUILD_SHA=<sha> APP_URL=... pnpm test:app:check  (optional: override sha)
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = process.env.APP_URL?.replace(/\/$/u, '');
if (!appUrl) {
  console.error('Error: APP_URL environment variable is required');
  console.error('Usage: APP_URL=https://your-app.example.com pnpm test:app:check');
  process.exit(1);
}

const buildSha =
  process.env.BUILD_SHA ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

const CHECKS_SOURCE_DIR = './integration-tests/test-application/checks';
const CHECKS_DIST_DIR = './integration-tests/test-application/dist/checks';

// Compile TypeScript check modules for Node.js. Bundle each file so relative
// imports (routes.ts, types.ts) are inlined and resolve correctly from dist/checks/.
mkdirSync(CHECKS_DIST_DIR, { recursive: true });
const checkFiles = readdirSync(CHECKS_SOURCE_DIR)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => join(CHECKS_SOURCE_DIR, f));

execSync(
  [
    './node_modules/.bin/esbuild',
    '--bundle',
    '--format=esm',
    '--platform=node',
    `--outdir=${CHECKS_DIST_DIR}`,
    checkFiles.join(' '),
  ].join(' '),
  { encoding: 'utf8' },
);

// Auto-discover all compiled check modules.
const checksDir = resolve(CHECKS_DIST_DIR);
const checkModules = await Promise.all(
  readdirSync(checksDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => import(/* webpackChunkName: "Check" */ pathToFileURL(join(checksDir, f)).href)),
);

// Run all checks and report all failures (not fail-fast).
const ctx = { buildSha };
const checkResults = await Promise.allSettled(
  checkModules.map(async (mod) => {
    await mod.check(appUrl, ctx);
    return mod.name;
  }),
);

let passed = 0;
let failed = 0;

for (const [index, result] of checkResults.entries()) {
  const modName = checkModules[index].name;
  if (result.status === 'fulfilled') {
    console.log(`✓ ${modName} check passed`);
    passed += 1;
  } else {
    console.error(`✗ ${modName} check failed: ${result.reason.message}`);
    failed += 1;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
