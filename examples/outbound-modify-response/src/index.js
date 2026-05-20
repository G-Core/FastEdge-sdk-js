async function app(event) {
  const outboundResponse = await fetch('http://jsonplaceholder.typicode.com/users');
  const users = await outboundResponse.json();
  return new Response(
    JSON.stringify({
      users: users.slice(0, 5),
      total: 5,
      skip: 0,
      limit: 30,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    },
  );
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
