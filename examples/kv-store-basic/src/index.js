import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  try {
    const myStore = KvStore.open('kv-store-name-as-defined-on-app');
    const entry = await myStore.getEntry('key');

    if (entry === null) {
      return new Response('Key not found', { status: 404 });
    }

    return new Response(`The KV Store responded with: ${await entry.text()}`);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
