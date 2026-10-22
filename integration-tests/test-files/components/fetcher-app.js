import { get } from 'acme:net/client';

addEventListener('fetch', (event) => {
  const to = new URL(event.request.url).searchParams.get('to');
  try {
    event.respondWith(new Response(get(to, '/hello')));
  } catch (error) {
    event.respondWith(new Response(String(error.payload), { status: 502 }));
  }
});
