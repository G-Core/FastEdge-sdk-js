import type { ByteReadableStream, EmbeddedStoreEntry } from './types.ts';

import type { UnderlyingSource } from 'node:stream/web';

/**
 * Creates a readable stream for a `Uint8Array`.
 *
 * @param array - The `Uint8Array` to create a readable stream for.
 * @returns A `ByteReadableStream` instance.
 */
const createReadableStreamForBytes = (array: Uint8Array): ByteReadableStream => {
  let _disturbed = false;
  let _readStarted = false;

  const underlyingSource: UnderlyingSource<Uint8Array> = {
    async start(controller: ReadableStreamDefaultController<Uint8Array>) {
      controller.enqueue(array);
      controller.close();
    },
  };

  const readableStream = new ReadableStream<Uint8Array>(underlyingSource);

  // Store the original getReader method BEFORE overriding it
  const originalGetReader = readableStream.getReader.bind(readableStream);

  const getReader = (): ReadableStreamDefaultReader<Uint8Array> => {
    const reader = originalGetReader();

    // Override read to track if the stream is disturbed
    const _read = reader.read.bind(reader);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reader as any).read = async () => {
      if (!_readStarted) {
        _readStarted = true;
        _disturbed = true;
      }
      const result = await _read();
      return result;
    };

    // Override cancel to track if the stream is disturbed
    const _cancel = reader.cancel.bind(reader);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reader as any).cancel = async (reason?: unknown) => {
      _disturbed = true;
      await _cancel(reason);
    };

    return reader;
  };

  return Object.assign(readableStream, {
    getReader,
    isLocked: () => readableStream.locked,
    isDisturbed: () => _disturbed,
    _markDisturbed: () => {
      _disturbed = true;
    },
  });
};
/**
 * Provides a Body-style interface to a `Uint8Array`.
 * This is for files that have been embedded using `readFileSync`.
 *
 * @param array - The `Uint8Array` representing the body.
 * @param contentEncoding - The content encoding of the body.
 * @param hash - The hash of the body.
 * @param size - The size of the body.
 * @returns An `EmbeddedStoreEntry` instance.
 */
const createEmbeddedStoreEntry = (
  array: Uint8Array,
  contentEncoding: string | null,
  hash: string,
  size: number,
): EmbeddedStoreEntry => {
  let _consumed = false;
  const _contentEncoding = contentEncoding;
  const _hash = hash;
  const _size = size;
  const _body = createReadableStreamForBytes(array);

  const arrayBuffer = async (): Promise<ArrayBuffer> => {
    if (_consumed) {
      throw new Error('Body has already been consumed');
    }
    if (_body.isLocked()) {
      throw new Error("The ReadableStream body is already locked and can't be consumed");
    }
    if (_body.isDisturbed()) {
      throw new Error('Body object should not be disturbed or locked');
    }
    _consumed = true;

    // Mark the stream as disturbed since we're consuming the body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_body as any)._markDisturbed();

    let result = new Uint8Array(0);
    const reader = _body.getReader();

    try {
      while (true) {
        // Await in loop is fine here.. loop runs until stream finishes (done => break)
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const newResult = new Uint8Array(result.length + value.length);
        newResult.set(result);
        newResult.set(value, result.length);
        result = newResult;
      }

      // Convert Uint8Array to ArrayBuffer properly
      // Intentionally creates a copy of the ArrayBuffer for isolation, matching web Body semantics.
      return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    } finally {
      reader.releaseLock();
    }
  };

  return {
    body: () => _body as ReadableStream<Uint8Array> | null,
    bodyUsed: () => _consumed,
    arrayBuffer,
    contentEncoding: () => _contentEncoding,
    hash: () => _hash,
    size: () => _size,
  };
};

export { createEmbeddedStoreEntry };
export type { EmbeddedStoreEntry } from './types.ts';
