import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const TEST_APP_SOURCE_FILE_PATH = './integration-tests/test-application/test-app.ts';
const TEST_APP_WASM_FILE_PATH = './integration-tests/test-application/dist/test-app.wasm';
const TEST_APP_TSCONFIG_PATH = './integration-tests/test-application/tsconfig.json';
const CHECKS_SOURCE_DIR = './integration-tests/test-application/checks';
const CHECKS_DIST_DIR = './integration-tests/test-application/dist/checks';

export default async ({ core }) => {
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  const workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();

  // Build the test app into a WASM binary
  const buildResponse = execSync(
    `./bin/fastedge-build.js --input ${TEST_APP_SOURCE_FILE_PATH} --output ${TEST_APP_WASM_FILE_PATH} --tsconfig ${TEST_APP_TSCONFIG_PATH}`,
    { encoding: 'utf8', cwd: workspaceDir },
  );

  core.info(`Build output: ${buildResponse}`);

  if (!buildResponse.includes('Build success!!')) {
    throw new Error('Failed to build test application into wasm binary');
  }

  core.info(`Test application built into wasm binary at ${TEST_APP_WASM_FILE_PATH}`);

  // Compile TypeScript check modules to JS so invoke-test-app.js can import them in Node.js.
  // fastedge:: modules are only available in the WASM runtime — mark them external so esbuild
  // leaves the imports as-is. The check functions never call handler code so they never execute.
  const checkFiles = readdirSync(join(workspaceDir, CHECKS_SOURCE_DIR))
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
    { encoding: 'utf8', cwd: workspaceDir },
  );

  core.info(`Check modules compiled to ${CHECKS_DIST_DIR}`);
};
