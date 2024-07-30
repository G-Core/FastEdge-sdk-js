export type ByteReadableStream = {
    /**
     * - Gets a reader for the stream.
     */
    getReader: () => ReadableStreamDefaultReader<Uint8Array>;
    /**
     * - Checks if the stream is locked.
     */
    isLocked: () => boolean;
    /**
     * - Checks if the stream is disturbed.
     */
    isDisturbed: () => boolean;
};
export type EmbeddedStoreEntry = {
    /**
     * - Returns the body as a ByteReadableStream or null.
     */
    body: () => ((ReadableStream<Uint8Array> & ByteReadableStream) | null);
    /**
     * - Checks if the body has been used.
     */
    bodyUsed: () => boolean;
    /**
     * - Returns a promise that resolves with an ArrayBuffer.
     */
    arrayBuffer: () => Promise<ArrayBuffer>;
    /**
     * - Returns the content encoding or null.
     */
    contentEncoding: () => (string | null);
    /**
     * - Returns the hash of the entry.
     */
    hash: () => string;
    /**
     * - Returns the size of the entry.
     */
    size: () => number;
};
/**
 * Provides a Body-style interface to Uint8Array.
 * The is for files that have been embedded using readFileSync
 * @param {Uint8Array} array
 * @param {string | null} contentEncoding
 * @param {string} hash
 * @param {number} size
 * @returns {EmbeddedStoreEntry} EmbeddedStoreEntry
 */
export function createEmbeddedStoreEntry(array: Uint8Array, contentEncoding: string | null, hash: string, size: number): EmbeddedStoreEntry;
