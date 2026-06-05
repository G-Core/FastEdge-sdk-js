const MAX_RETRIES = 3;
const INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS = 15;
const RETRY_DELAY_SECONDS = 5;

const sleep = (secs) => new Promise((resolve) => setTimeout(resolve, secs * 1000));

async function checkEnv(appUrl, buildSha) {
  const res = await fetch(appUrl);
  if (res.status !== 200) throw new Error(`/: bad status ${res.status}`);
  const data = await res.json();
  if (data.build_sha !== buildSha) {
    throw new Error(`/: build_sha mismatch: expected ${buildSha}, got ${data.build_sha}`);
  }
}

async function checkOutboundFetch(appUrl) {
  const res = await fetch(`${appUrl}/fetch`);
  if (res.status !== 200) throw new Error(`/fetch: bad status ${res.status}`);
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`/fetch: outbound request failed (ok=${data.ok}, status=${data.status})`);
  }
  if (!data.cdnDebugEndpoint || typeof data.cdnDebugEndpoint !== 'string' || !data.cdnDebugEndpoint.includes('.well-known')) {
    throw new Error(`/fetch: missing or invalid cdnDebugEndpoint: "${data.cdnDebugEndpoint}"`);
  }
}

async function checkSecret(appUrl) {
  const res = await fetch(`${appUrl}/secret`);
  if (res.status !== 200) throw new Error(`/secret: bad status ${res.status}`);
  const data = await res.json();
  if (data.value !== 'hello-from-fastedge-secret') {
    throw new Error(`/secret: wrong value "${data.value}"`);
  }
}

async function checkRequestEcho(appUrl) {
  const res = await fetch(`${appUrl}/echo`, {
    method: 'POST',
    headers: { 'x-test-header': 'hello-fastedge', 'content-type': 'text/plain' },
    body: 'ping',
  });
  if (res.status !== 200) throw new Error(`/echo: bad status ${res.status}`);
  const data = await res.json();
  if (data.method !== 'POST') throw new Error(`/echo: wrong method "${data.method}"`);
  if (data.body !== 'ping') throw new Error(`/echo: wrong body "${data.body}"`);
  if (data.headers?.['x-test-header'] !== 'hello-fastedge') {
    throw new Error(`/echo: wrong x-test-header "${data.headers?.['x-test-header']}"`);
  }
}

export default async ({ github, context, core }) => {
  if (!process.env.GITHUB_ENV) {
    throw new Error(
      'GITHUB_ENV is not defined. This script must be run in a GitHub Actions environment.',
    );
  }

  const appUrl = process.env.APP_URL.replace(/\/$/, '');
  const buildSha = context.sha;

  await sleep(INITIAL_WAIT_FOR_DEPLOYMENT_SECONDS);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await sleep(RETRY_DELAY_SECONDS);
    try {
      await checkEnv(appUrl, buildSha);
      core.info('✓ env check passed');

      await checkOutboundFetch(appUrl);
      core.info('✓ outbound fetch check passed');

      await checkSecret(appUrl);
      core.info('✓ secret check passed');

      await checkRequestEcho(appUrl);
      core.info('✓ request echo check passed');

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
