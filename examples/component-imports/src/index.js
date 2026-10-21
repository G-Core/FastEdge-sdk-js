// Scans the request path and query with a regexped Wasm component, imported by its WIT
// interface. fastedge-build composes urlguard.wasm into the app (see .fastedge/build-config.js).
import { scanUrl } from 'regexped:urlguard/sets';

// Pattern order in regexped.yaml: scanUrl returns the index of a pattern that matched.
const PATTERNS = ['sql_injection', 'path_traversal', 'xss', 'log4shell', 'template_injection'];

function handle(event) {
  const url = new URL(event.request.url);
  const target = decodeURIComponent(url.pathname + url.search);
  let id;
  try {
    id = scanUrl(new TextEncoder().encode(target), 0);
  } catch (error) {
    // The component's error-code, e.g. 'backtrack-overflow'
    return new Response(`Scan failed: ${error.payload ?? error}`, { status: 500 });
  }
  if (id === undefined) {
    return new Response('ok');
  }
  return Response.json({ blocked: PATTERNS[id] }, { status: 403 });
}

addEventListener('fetch', (event) => event.respondWith(handle(event)));
