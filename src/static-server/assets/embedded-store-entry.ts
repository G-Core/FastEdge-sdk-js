/**
 * Represents a readable stream for a `Uint8Array` with additional methods.
 */
interface ByteReadableStream extends ReadableStream<Uint8Array> {
  getReader(): ReadableStreamDefaultReader<Uint8Array>;
  isLocked(): boolean;
  isDisturbed(): boolean;
}

/**
 * Represents an embedded store entry.
 */
interface EmbeddedStoreEntry {
  body(): ReadableStream<Uint8Array> | null;
  bodyUsed(): boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  contentEncoding(): string | null;
  hash(): string;
  size(): number;
}

/**
 * Creates a readable stream for a `Uint8Array`.
 *
 * @param array - The `Uint8Array` to create a readable stream for.
 * @returns A `ByteReadableStream` instance.
 */
const createReadableStreamForBytes = (array: Uint8Array): ByteReadableStream => {
  let _disturbed = false;

  const underlyingSource: UnderlyingSource<Uint8Array> = {
    // @ts-expect-error - Uint8Array extends ArrayBufferLike, this interface works for our purpose
    async start(controller: ReadableStreamDefaultController<Uint8Array>) {
      controller.enqueue(array);
      controller.close();
    },
  };

  const readableStream = new ReadableStream<Uint8Array>(underlyingSource);

  const getReader = (): ReadableStreamDefaultReader<Uint8Array> => {
    const reader = readableStream.getReader();

    // Override read to track if the stream is disturbed
    const _read = reader.read.bind(reader);
    reader.read = async () => {
      const result = await _read();
      if (result.done) {
        _disturbed = true;
      }
      return result;
    };

    // Override cancel to track if the stream is disturbed
    const _cancel = reader.cancel.bind(reader);
    reader.cancel = async (reason?: any) => {
      await _cancel(reason);
      _disturbed = true;
    };

    return reader;
  };

  return Object.assign(readableStream, {
    getReader,
    isLocked: () => readableStream.locked,
    isDisturbed: () => _disturbed,
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

      return result;
    } finally {
      reader.releaseLock();
    }
  };

  // KvStore Implementation ??
  // const text = async () => {
  //   const data = await arrayBuffer();
  //   return decoder.decode(data);
  // };

  // const json = async () => {
  //   const _text = await text();
  //   return JSON.parse(_text);
  // };

  return {
    body: () => _body as ReadableStream<Uint8Array> | null,
    bodyUsed: () => _consumed,
    arrayBuffer,
    // text,
    // json,
    contentEncoding: () => _contentEncoding,
    hash: () => _hash,
    size: () => _size,
  };
};

export { createEmbeddedStoreEntry };
export type { EmbeddedStoreEntry, ByteReadableStream };
