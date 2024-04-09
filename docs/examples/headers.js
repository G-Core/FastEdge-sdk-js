import { getEnv } from 'fastedge::getenv';

async function eventHandler(event) {
  const request = event.request;

  const customEnvVariable = getEnv('MY_CUSTOM_ENV_VAR');

  const responseHeaders = new Headers(request.headers);
  responseHeaders.set('my-custom-header', customEnvVariable);

  return new Response('Returned all headers with a custom header added', {
    headers: responseHeaders,
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
