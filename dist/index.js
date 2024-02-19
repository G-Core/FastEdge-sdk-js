async function eventHandler(event) {
  const request = event.request;

  const city = request.headers.get('geoip-city');
  const countryCode = request.headers.get('geoip-country-code');
  const env = JSON.stringify(process.env);

  let headerMap = 'HEADERS: ';
  for (const [key, value] of event.request.headers.entries()) {
    headerMap += `["${key}","${value}"] \n`;
  }
  return new Response(`
    Hello, you are requesting from ${city}, ${countryCode} \n
    env: ${env} \n
    env: ${process.env?.NODE_ENV ?? 'unknown'} \n
    env.MY_CUSTOM_VALUE: ${process.env?.MY_CUSTOM_VALUE ?? 'unknown'} \n
  `);
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
