function app(event) {
  const { request, client } = event;

  const lines = [
    `Method: ${request.method}`,
    `URL: ${request.url}`,
    `Client: ${client.address}`,
    'Headers:',
  ];
  for (const [name, value] of request.headers) {
    lines.push(`    ${name}: ${value}`);
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
