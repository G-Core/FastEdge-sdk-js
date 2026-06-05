import { getEnv } from 'fastedge::env';
import { getSecret } from 'fastedge::secret';

async function handleEnvCheck(event) {
  const build_sha = getEnv('BUILD_SHA');
  return Response.json({
    message: 'app running on production',
    build_sha: `${build_sha}`,
  });
}

async function handleOutboundFetch(event) {
  const targetUrl = getEnv('TEST_FETCH_URL') || 'https://auth.gcore.com/login/assets/config.json';
  const res = await fetch(targetUrl);
  const data = await res.json();
  return Response.json({
    status: res.status,
    ok: res.ok,
    cdnDebugEndpoint: data?.cdnDebugEndpoint,
  });
}

async function handleSecretCheck(event) {
  const value = getSecret('test-secret');
  return Response.json({ value });
}

async function handleRequestEcho(event) {
  const req = event.request;
  const body = await req.text();
  return Response.json({
    method: req.method,
    headers: Object.fromEntries(req.headers),
    body,
  });
}

addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  let handler;
  if (url.pathname === '/fetch') {
    handler = handleOutboundFetch;
  } else if (url.pathname === '/secret') {
    handler = handleSecretCheck;
  } else if (url.pathname === '/echo') {
    handler = handleRequestEcho;
  } else {
    handler = handleEnvCheck;
  }
  event.respondWith(handler(event));
});
