const decoder = new TextDecoder();

/**
 * @param {Uint8Array} array
 * @returns {import('./embedded-store-types.d.ts').ByteReadableStream} ByteReadableStream
 */
const createReadableStreamForBytes = (array) => {
  // Track if the stream has been read or cancelled
  let _disturbed = false;

  /**
   * @type {UnderlyingSource<Uint8Array>}
   */
  const underlyingSource = {
    async start(controller) {
      /**
       * @type {ReadableStreamDefaultController<Uint8Array>}
       */
      controller.enqueue(array);
      controller.close();
    },
  };

  const readableStream = new ReadableStream(underlyingSource);

  const getReader = () => {
    const reader = readableStream.getReader();

    // Override read to allow setting _disturbed at end of stream
    const _read = reader.read;
    reader.read = async () => {
      const result = await _read.call(reader);
      if (result.done) {
        _disturbed = true;
      }
      return result;
    };

    // Override cancel to allow setting _disturbed if cancelled
    const _cancel = reader.cancel;
    reader.cancel = async (reason) => {
      await _cancel.call(reader, reason);
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
 * Provides a Body-style interface to Uint8Array.
 * The is for files that have been embedded using readFileSync
 * @param {Uint8Array} array
 * @param {string | null} contentEncoding
 * @param {string} hash
 * @param {number} size
 * @returns {import('./embedded-store-types.d.ts').EmbeddedStoreEntry} EmbeddedStoreEntry
 */
const createEmbeddedStoreEntry = (array, contentEncoding, hash, size) => {
  let _consumed = false;
  const _contentEncoding = contentEncoding;
  const _hash = hash;
  const _size = size;
  const _body = createReadableStreamForBytes(array);

  const arrayBuffer = async () => {
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
    body: () => _body,
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
