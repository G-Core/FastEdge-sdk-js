// Temporary guard helper for the Response.clone() test: serves a multi-chunk streaming
// body so the clone test can fetch a genuine host-backed (HttpIncomingBody) body that the
// host re-segments across multiple reads. Remove once
// https://github.com/bytecodealliance/StarlingMonkey/pull/312 merges and the StarlingMonkey
// submodule is rebased onto a release containing it.
import { MULTI_CHUNK_SOURCE } from '../routes.js';

export const route = MULTI_CHUNK_SOURCE.route;

const CHUNK_SIZE = 1024;
const CHUNK_COUNT = 128; // ~128 KiB total — large enough to span multiple host reads

export async function handler(_req: Request): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < CHUNK_COUNT; i += 1) {
        // Distinct per-chunk prefix padded to a fixed width, so the reassembled body is
        // deterministic (CHUNK_SIZE * CHUNK_COUNT bytes) and order-sensitive.
        controller.enqueue(encoder.encode(`${i}:`.padEnd(CHUNK_SIZE, '.')));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/octet-stream' } });
}
