async function eventHandler(event) {
  const request = event.request;
  return new Response(`You made dsdsa request to ${request.url}`);
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
