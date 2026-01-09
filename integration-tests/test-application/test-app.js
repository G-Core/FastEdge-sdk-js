import { getEnv } from 'fastedge::env';

async function eventHandler(event) {
  const build_sha = getEnv('BUILD_SHA');

  return Response.json({
    message: 'app running on production',
    build_sha: `${build_sha}`,
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
