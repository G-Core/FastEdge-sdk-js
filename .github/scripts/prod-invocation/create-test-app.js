const { execSync } = require('child_process');
const { writeFileSync } = require('fs');

const TEST_APP_SOURCE_FILE_PATH = './integration-tests/test-application/test-app.js';
const TEST_APP_WASM_FILE_PATH = './integration-tests/test-application/test-app.wasm';

/*
 * Github Action that deploys this will re-use the same app for all tests.
 * Build sha ensures each test app invocation is unique per commit.
 */
const testAppcode = (build_sha) => `
// TODO: ADD env, secret, kv etc...

async function eventHandler(event) {
  return Response.json({
    message: 'app running on production',
    build_sha: '${build_sha}'
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
`;

module.exports = async ({ github, context, core }) => {
  // Ensure this is running in GitHub Actions
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  // Create a new source file at ./integration-tests/test-application/test-app.js with the testAppcode
  const build_sha = context.sha;

  writeFileSync(TEST_APP_SOURCE_FILE_PATH, testAppcode(build_sha), 'utf8');

  core.info(`Test application code written to ${TEST_APP_SOURCE_FILE_PATH}`);
  // Build the testAppcode into a wasm binary
  const buildResponse = execSync(
    './bin/fastedge-build --input ' +
      TEST_APP_SOURCE_FILE_PATH +
      ' --output ' +
      TEST_APP_WASM_FILE_PATH,
    { stdio: 'inherit' },
  );
  if (!buildResponse.includes('Build success!!')) {
    throw new Error('Failed to build test application into wasm binary');
  }

  core.info(`Test application built into wasm binary at ${TEST_APP_WASM_FILE_PATH}`);
};
