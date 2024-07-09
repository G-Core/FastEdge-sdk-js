export interface ByteReadableStream {
  getReader: () => ReadableStreamDefaultReader<Uint8Array>;
  isLocked: () => boolean;
  isDisturbed: () => boolean;
}
