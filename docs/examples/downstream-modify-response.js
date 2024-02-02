async function app(event) {
  const downstreamResponse = await fetch('https://dummyjson.com/recipes');
  const resJson = await downstreamResponse.json();
  return new Response(
    JSON.stringify({
      recipes: resJson.recipes.slice(0, 5),
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
