function app(event) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        controller.enqueue(encoder.encode(`chunk ${i}\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
