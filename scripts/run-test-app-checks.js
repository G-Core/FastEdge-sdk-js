#!/usr/bin/env node
// Compiles checks/*.ts and runs all check functions against a deployed app.
// Usage: APP_URL=https://your-app.example.com pnpm test:app:check
//        BUILD_SHA=<sha> APP_URL=... pnpm test:app:check  (optional: override sha)
import { execSync } from 'child_process';
import { mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

const appUrl = process.env.APP_URL?.replace(/\/$/, '');
if (!appUrl) {
  console.error('Error: APP_URL environment variable is required');
  console.error('Usage: APP_URL=https://your-app.example.com pnpm test:app:check');
  process.exit(1);
}

const buildSha =
  process.env.BUILD_SHA ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

const CHECKS_SOURCE_DIR = './integration-tests/test-application/checks';
const CHECKS_DIST_DIR = './integration-tests/test-application/dist/checks';

// Compile TypeScript check modules for Node.js. fastedge:: modules are WASM-only
// so they are marked external — check functions never call handler code, so they
// never execute and the missing modules are never imported at runtime.
mkdirSync(CHECKS_DIST_DIR, { recursive: true });
const checkFiles = readdirSync(CHECKS_SOURCE_DIR)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => join(CHECKS_SOURCE_DIR, f));

execSync(
  [
    'node ./node_modules/.bin/esbuild',
    '--bundle=false',
    '--format=esm',
    '--platform=node',
    '--external:fastedge::*',
    `--outdir=${CHECKS_DIST_DIR}`,
    checkFiles.join(' '),
  ].join(' '),
  { encoding: 'utf8' },
);

// Auto-discover and run all check modules. Unlike CI, runs all checks and
// reports all failures rather than stopping on the first.
const checksDir = resolve(CHECKS_DIST_DIR);
const checkModules = await Promise.all(
  readdirSync(checksDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => import(pathToFileURL(join(checksDir, f)).href)),
);

const ctx = { buildSha };
let passed = 0;
let failed = 0;

for (const mod of checkModules) {
  try {
    await mod.check(appUrl, ctx);
    console.log(`✓ ${mod.name} check passed`);
    passed++;
  } catch (e) {
    console.error(`✗ ${mod.name} check failed: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
