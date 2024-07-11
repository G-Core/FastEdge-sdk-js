import { getStaticServer, cre } from '@gcoredev/fastedge-sdk-js';
const staticServer = getStaticServer();

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  const response = await staticServer.serveRequest(event.request);
  if (response != null) {
    return response;
  }

  return new Response('Not found', { status: 404 });
}
