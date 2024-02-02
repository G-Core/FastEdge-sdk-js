async function app(event) {
  return await fetch('https://dummyjson.com/todos');
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
