const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const testConfig = require('./config.js');

/*
 * Github Action that deploys this will re-use the same app-id for all tests.
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
  // Ensure it only runs when merfing to main
  // todo: Farq: main??
  if (context.ref !== 'refs/heads/alpha') {
    core.info(
      `Current ref is ${context.ref}. Skipping test application creation and build as it only runs on main branch.`,
    );
    return;
  }

  // Ensure this is running in GitHub Actions
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  // Create a new source file at ./integration-tests/test-application/test-app.js with the testAppcode
  const build_sha = context.sha;
  const { testAppSourceFilePath, testAppWasmFilePath } = testConfig;

  writeFileSync(testAppSourceFilePath, testAppcode(build_sha), 'utf8');

  core.info(`Test application code written to ${testAppSourceFilePath}`);

  // Build the testAppcode into a wasm binary
  const buildResponse = execSync(
    './bin/fastedge-build --input ' + testAppSourceFilePath + ' --output ' + testAppWasmFilePath,
    { stdio: 'inherit' },
  );
  if (!buildResponse.includes('Build success!!')) {
    throw new Error('Failed to build test application into wasm binary');
  }

  core.info(`Test application built into wasm binary at ${testAppWasmFilePath}`);
};
