/**
 * Represents additional methods for a readable stream of Uint8Array.
 */
interface ByteStreamMethods {
    getReader(): ReadableStreamDefaultReader<Uint8Array>;
    isLocked(): boolean;
    isDisturbed(): boolean;
}
/**
 * Represents a readable stream for a `Uint8Array` with additional methods.
 */
type ByteReadableStream = ReadableStream<Uint8Array> & ByteStreamMethods;
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
export type { ByteReadableStream, ByteStreamMethods, EmbeddedStoreEntry };
