import { execSync } from 'child_process';

const TEST_APP_SOURCE_FILE_PATH = './integration-tests/test-application/test-app.js';
const TEST_APP_WASM_FILE_PATH = './integration-tests/test-application/test-app.wasm';

export default async ({ github, context, core }) => {
  // Ensure this is running in GitHub Actions
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  const workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();

  // Build the testAppcode into a wasm binary
  const buildResponse = execSync(
    './bin/fastedge-build.js --input ' +
      TEST_APP_SOURCE_FILE_PATH +
      ' --output ' +
      TEST_APP_WASM_FILE_PATH,
    { encoding: 'utf8', cwd: workspaceDir },
  );

  core.info(`Build output: ${buildResponse}`);

  if (!buildResponse.includes('Build success!!')) {
    throw new Error('Failed to build test application into wasm binary');
  }

  core.info(`Test application built into wasm binary at ${TEST_APP_WASM_FILE_PATH}`);
};
