async function app(event) {
  return await fetch('http://jsonplaceholder.typicode.com/users');
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
