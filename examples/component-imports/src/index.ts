// Serves the images in ./images and, with ?w=<width>, a thumbnail made by a Rust Wasm component
// imported by its WIT interface. fastedge-build composes thumbnail.wasm into the app (see
// .fastedge/build-config.js) and writes its TypeScript declarations to fastedge-components.d.ts.
import { createStaticServer } from '@gcoredev/fastedge-sdk-js';
import { dimensions, resize } from 'example:image/thumbnail';

import { staticAssetManifest } from './images-static-assets';

// Decoding is the costly step and grows with the pixel count. The free plan allows 100 ms and
// 52 MB per request; a 0.5 MP JPEG decodes in ~10-30 ms on the edge, a 12 MP photo in ~600 ms.
const MAX_PIXELS = 500_000;
const MIN_WIDTH = 16;
const MAX_WIDTH = 800;

const images = createStaticServer(staticAssetManifest, {});

async function handle(request: Request): Promise<Response> {
  const original = await images.serveRequest(request);
  if (!original) {
    return new Response('Not found', { status: 404 });
  }
  const url = new URL(request.url);
  const w = url.searchParams.get('w');
  // No ?w=, or not a full response (e.g. 304 Not Modified): serve the original as it is
  if (w === null || original.status !== 200) {
    return original;
  }
  const maxWidth = Number.parseInt(w, 10);
  if (Number.isNaN(maxWidth)) {
    return new Response('w must be a number', { status: 400 });
  }
  const format = url.searchParams.get('format') === 'png' ? 'png' : 'jpeg';

  // The component works on bytes: the same code serves images fetched from an origin
  const bytes = new Uint8Array(await original.arrayBuffer());
  try {
    const { width, height } = dimensions(bytes);
    if (width * height > MAX_PIXELS) {
      return new Response(`${width}x${height} is over the ${MAX_PIXELS}-pixel limit`, {
        status: 413,
      });
    }
    const thumbnail = resize(bytes, {
      maxWidth: Math.min(Math.max(maxWidth, MIN_WIDTH), MAX_WIDTH),
      format,
    });
    return new Response(thumbnail, { headers: { 'content-type': `image/${format}` } });
  } catch (error) {
    // A WIT `result` error is thrown, with the component's message in `payload`
    return new Response(`Cannot read image: ${(error as { payload: string }).payload}`, {
      status: 415,
    });
  }
}

addEventListener('fetch', (event: FetchEvent) => event.respondWith(handle(event.request)));
