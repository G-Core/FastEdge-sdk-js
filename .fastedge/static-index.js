/// <reference types="@gcoredev/fastedge-sdk-js" />
import { getServer } from './build/static-server.js';
const staticServer = getServer();

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  const response = await staticServer.serveRequest(event.request);
  if (response != null) {
    return response;
  }

  return new Response('Not found', { status: 404 });
}
