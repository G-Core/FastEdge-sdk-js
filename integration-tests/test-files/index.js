async function app(event) {
  return 'You made a Test request';
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
