import { getEnv } from 'fastedge::env';
import { getSecret } from 'fastedge::secret';

async function eventHandler(event) {
  const username = getEnv('USERNAME');
  const password = getSecret('PASSWORD');

  return new Response(`Username: ${username}, Password: ${password}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
