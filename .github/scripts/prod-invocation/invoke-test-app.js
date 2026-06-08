import { readdirSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

const MAX_RETRIES = 3;
const INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS = 15;
const RETRY_DELAY_SECONDS = 5;

const sleep = (secs) => new Promise((r) => setTimeout(r, secs * 1000));

export default async ({ context, core }) => {
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  const appUrl = process.env.APP_URL.replace(/\/$/, '');
  const ctx = { buildSha: context.sha };

  // Auto-discover compiled check modules from checks/dist/
  const checksDir = resolve('./integration-tests/test-application/dist/checks');
  const checkModules = await Promise.all(
    readdirSync(checksDir)
      .filter((f) => f.endsWith('.js'))
      .map((f) => import(pathToFileURL(join(checksDir, f)).href)),
  );

  await sleep(INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await sleep(RETRY_DELAY_SECONDS);
    try {
      for (const mod of checkModules) {
        await mod.check(appUrl, ctx);
        core.info(`✓ ${mod.name} check passed`);
      }
      break;
    } catch (error) {
      core.warning(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Test application invocation failed after ${MAX_RETRIES} attempts: ${error.message}`,
        );
      }
    }
  }

  core.info('All checks passed.');
};
