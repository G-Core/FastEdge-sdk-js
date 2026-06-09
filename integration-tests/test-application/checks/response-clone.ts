// Temporary guard: remove once https://github.com/bytecodealliance/StarlingMonkey/pull/312
// merges upstream and the StarlingMonkey submodule is rebased onto a release containing it.
import type { CheckContext } from '../types.js';
import { RESPONSE_CLONE } from '../routes.js';

export const name = RESPONSE_CLONE.name;

interface ResponseCloneResult {
  constructed: {
    origText: string;
    cloneText: string;
    cloneStatus: number;
    cloneHeader: string | null;
  };
  constructedReader: {
    origText: string;
    cloneText: string;
  };
  incomingText: {
    origText: string;
    cloneText: string;
  };
  incomingReader: {
    origText: string;
    cloneText: string;
  };
  multiChunk: {
    origLength: number;
    matches: boolean;
  };
  canceledOriginal: {
    cloneLength: number;
    matchesSource: boolean;
  };
  headerThenClone: {
    error: string | null;
    bodiesMatch: boolean;
  };
  consumedCloneError: string | null;
  lockedCloneError: string | null;
}

// MULTI_CHUNK_SOURCE serves CHUNK_COUNT (128) chunks of CHUNK_SIZE (1024) bytes.
const MULTI_CHUNK_BODY_LENGTH = 128 * 1024;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`${RESPONSE_CLONE.route}: ${message}`);
}

export async function check(appUrl: string, _ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${RESPONSE_CLONE.route}`);
  assert(res.status === 200, `bad status ${res.status}`);
  const data = (await res.json()) as ResponseCloneResult;

  // Test 1: constructed text() — basic clone correctness + metadata preservation
  assert(
    data.constructed.origText === 'clone-body',
    `constructed origText wrong: "${data.constructed.origText}"`,
  );
  assert(
    data.constructed.cloneText === 'clone-body',
    `constructed cloneText wrong: "${data.constructed.cloneText}"`,
  );
  assert(
    data.constructed.cloneStatus === 201,
    `constructed cloneStatus wrong: ${data.constructed.cloneStatus}`,
  );
  assert(
    data.constructed.cloneHeader === 'value',
    `constructed cloneHeader wrong: "${data.constructed.cloneHeader}"`,
  );

  // Test 2: constructed getReader() + mutation guard
  // origText was decoded before fill(0); cloneText must match it, not return null bytes.
  assert(
    data.constructedReader.origText === 'reader-body',
    `constructedReader origText wrong: "${data.constructedReader.origText}"`,
  );
  assert(
    data.constructedReader.cloneText === 'reader-body',
    `constructedReader cloneText wrong after mutation: "${data.constructedReader.cloneText}" — shared buffer detected`,
  );

  // Test 3: incoming fetch() text() — HttpIncomingBody materialisation + tee
  assert(data.incomingText.origText.length > 0, 'incomingText origText is empty');
  assert(data.incomingText.cloneText.length > 0, 'incomingText cloneText is empty');
  assert(
    data.incomingText.origText === data.incomingText.cloneText,
    'incomingText orig/clone mismatch',
  );

  // Test 4: incoming fetch() getReader() + mutation guard
  // The precise original bug scenario: host-backed body, both branches via getReader().
  // origText decoded before fill(0); if buffers are shared, cloneText would be null bytes.
  assert(data.incomingReader.origText.length > 0, 'incomingReader origText is empty');
  assert(
    data.incomingReader.cloneText.length > 0,
    'incomingReader cloneText is empty after mutation — shared buffer detected',
  );
  assert(
    data.incomingReader.origText === data.incomingReader.cloneText,
    `incomingReader orig/clone mismatch after mutation — shared buffer detected`,
  );

  // Test 5: consuming a body then cloning throws TypeError
  assert(
    data.consumedCloneError === 'TypeError',
    `expected TypeError cloning consumed body, got "${data.consumedCloneError}"`,
  );

  // Test 6: locking a body (via getReader) then cloning throws TypeError
  assert(
    data.lockedCloneError === 'TypeError',
    `expected TypeError cloning locked body, got "${data.lockedCloneError}"`,
  );

  // Test 7: host-backed, multi-chunk body + mutation guard.
  // A genuine HttpIncomingBody re-segmented across multiple host reads; if any chunk's buffer
  // is shared across the tee, fill(0) on the original would corrupt the clone.
  assert(
    data.multiChunk.origLength === MULTI_CHUNK_BODY_LENGTH,
    `multiChunk origLength wrong: ${data.multiChunk.origLength} (expected ${MULTI_CHUNK_BODY_LENGTH})`,
  );
  assert(
    data.multiChunk.matches,
    `multiChunk clone != original after mutation — shared buffer across multi-chunk host body`,
  );

  // Test 8: cancelling the original branch must not starve or corrupt the clone.
  assert(
    data.canceledOriginal.cloneLength === MULTI_CHUNK_BODY_LENGTH,
    `canceledOriginal cloneLength wrong: ${data.canceledOriginal.cloneLength} (clone starved by original cancel)`,
  );
  assert(
    data.canceledOriginal.matchesSource,
    `canceledOriginal clone content mismatch after cancelling the original branch`,
  );

  // Test 9: reading a header on an incoming response then cloning must not throw.
  assert(
    data.headerThenClone.error === null,
    `cloning after reading a header threw: ${data.headerThenClone.error}`,
  );
  assert(
    data.headerThenClone.bodiesMatch,
    `headerThenClone bodies empty or mismatched`,
  );
}
