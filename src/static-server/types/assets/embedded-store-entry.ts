export interface ByteReadableStream extends ReadableStream<Uint8Array> {
  getReader: () => any; // todo: fix this: ReadableStreamDefaultReader<Uint8Array>;
  isLocked: () => boolean;
  isDisturbed: () => boolean;
}

export interface EmbeddedStoreEntry {
  body(): ByteReadableStream | null;
  bodyUsed(): boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  // json(): Promise<any>;
  // text(): Promise<string>;
  contentEncoding(): string | null;
  hash(): string;
  size(): number;
}
