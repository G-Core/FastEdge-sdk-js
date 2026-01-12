const MAX_RETRIES = 3;
const INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS = 15;
const RETRY_DELAY_SECONDS = 5;
const DATA_IS_VALID = 'DATA_IS_VALID';

const sleep = (secs = RETRY_DELAY_SECONDS) =>
  new Promise((resolve) => setTimeout(resolve, secs * 1000));

const isResponseDataValid = (data, build_sha) => {
  if (data.build_sha !== build_sha) {
    return `prod environment build_sha mismatch: expected ${build_sha}, got ${data.build_sha}`;
  }

  return DATA_IS_VALID;
};

export default async ({ github, context, core }) => {
  // Ensure this is running in GitHub Actions
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  const appUrl = process.env.APP_URL;
  const build_sha = context.sha;

  // Give the production environment some time to update with the new test application
  await sleep(INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Pause between attempts
    await sleep(RETRY_DELAY_SECONDS);
    try {
      const res = await fetch(appUrl);
      if (res.status !== 200) {
        throw new Error(`prod environment bad response: ${res.status}`);
      }
      const data = await res.json();
      core.info(`Response data: ${JSON.stringify(data)}`);

      // validate response data matches what we expect
      const validationResult = isResponseDataValid(data, build_sha);
      if (validationResult === DATA_IS_VALID) {
        // Response is as we expected
        break;
      }

      throw new Error(validationResult);
    } catch (error) {
      // Log the error and retry again after a delay
      core.warning(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt === MAX_RETRIES) {
        // If we've reached the max retries, re-throw an error to kill the workflow
        throw new Error(
          `Test application invocation failed after ${MAX_RETRIES} attempts: ${error.message}`,
        );
      }
    }
  }

  core.info(`Test application invocation succeeded with status 200 and valid response data.`);
};
