// Temporary guard: remove once https://github.com/bytecodealliance/StarlingMonkey/pull/312
// merges upstream and the StarlingMonkey submodule is rebased onto a release containing it.
import { getEnv } from 'fastedge::env';
import { RESPONSE_CLONE } from '../routes.js';

export const route = RESPONSE_CLONE.route;

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return chunks;
}

function decodeChunks(chunks: Uint8Array[]): string {
  const total = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    total.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(total);
}

export async function handler(_req: Request): Promise<Response> {
  const fetchUrl = getEnv('TEST_FETCH_URL') || 'https://auth.gcore.com/login/assets/config.json';

  // Test 1: constructed response — text() on both branches (basic correctness + metadata)
  const constructed = new Response('clone-body', { status: 201, headers: { 'x-test': 'value' } });
  const constructedClone = constructed.clone();
  const [constructedOrigText, constructedCloneText] = await Promise.all([
    constructed.text(),
    constructedClone.text(),
  ]);

  // Test 2: constructed response — getReader() + mutation guard.
  // Drain original, poison its chunk buffers with fill(0), then drain clone.
  // If the tee shares the underlying ArrayBuffer, clone reads zeroed data.
  const forReader = new Response('reader-body');
  const forReaderClone = forReader.clone();
  const constructedOrigChunks = await readStream(forReader.body!);
  const constructedReaderOrigText = decodeChunks(constructedOrigChunks);
  for (const chunk of constructedOrigChunks) chunk.fill(0);
  const constructedReaderCloneText = decodeChunks(await readStream(forReaderClone.body!));

  // Test 3: incoming fetch() — text() on both branches.
  // Exercises the HttpIncomingBody materialisation + tee path.
  const incoming = await fetch(fetchUrl);
  const incomingClone = incoming.clone();
  const [incomingTextOrigText, incomingTextCloneText] = await Promise.all([
    incoming.text(),
    incomingClone.text(),
  ]);

  // Test 4: incoming fetch() — getReader() + mutation guard.
  // The precise original bug scenario: host-backed body + getReader() on both branches.
  // Drain original via getReader(), poison its buffers, then drain clone via getReader().
  const incomingForReader = await fetch(fetchUrl);
  const incomingForReaderClone = incomingForReader.clone();
  const incomingOrigChunks = await readStream(incomingForReader.body!);
  const incomingReaderOrigText = decodeChunks(incomingOrigChunks);
  for (const chunk of incomingOrigChunks) chunk.fill(0);
  const incomingReaderCloneText = decodeChunks(await readStream(incomingForReaderClone.body!));

  // Test 5: cloning a consumed body throws TypeError.
  const consumed = new Response('consumed');
  await consumed.text();
  let consumedCloneError: string | null = null;
  try {
    consumed.clone();
  } catch (error) {
    consumedCloneError =
      error instanceof TypeError ? 'TypeError' : (error as Error).constructor.name;
  }

  // Test 6: cloning a locked body (getReader() called) throws TypeError.
  const locked = new Response('locked');
  locked.body!.getReader();
  let lockedCloneError: string | null = null;
  try {
    locked.clone();
  } catch (error) {
    lockedCloneError =
      error instanceof TypeError ? 'TypeError' : (error as Error).constructor.name;
  }

  return Response.json({
    constructed: {
      origText: constructedOrigText,
      cloneText: constructedCloneText,
      cloneStatus: constructedClone.status,
      cloneHeader: constructedClone.headers.get('x-test'),
    },
    constructedReader: {
      origText: constructedReaderOrigText,
      cloneText: constructedReaderCloneText,
    },
    incomingText: {
      origText: incomingTextOrigText,
      cloneText: incomingTextCloneText,
    },
    incomingReader: {
      origText: incomingReaderOrigText,
      cloneText: incomingReaderCloneText,
    },
    consumedCloneError,
    lockedCloneError,
  });
}
