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
 * Provides a Body-style interface to a `Uint8Array`.
 * This is for files that have been embedded using `readFileSync`.
 *
 * @param array - The `Uint8Array` representing the body.
 * @param contentEncoding - The content encoding of the body.
 * @param hash - The hash of the body.
 * @param size - The size of the body.
 * @returns An `EmbeddedStoreEntry` instance.
 */
declare const createEmbeddedStoreEntry: (array: Uint8Array, contentEncoding: string | null, hash: string, size: number) => EmbeddedStoreEntry;
export { createEmbeddedStoreEntry };
export type { EmbeddedStoreEntry, ByteReadableStream };
