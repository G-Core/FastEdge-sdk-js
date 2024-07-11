/**
 * Provides a Body-style interface to Uint8Array.
 * The is for files that have been embedded using readFileSync
 * @param {Uint8Array} array
 * @param {string | null} contentEncoding
 * @param {string} hash
 * @param {number} size
 * @returns {import('./embedded-store-types.d.ts').EmbeddedStoreEntry} EmbeddedStoreEntry
 */
export function createEmbeddedStoreEntry(array: Uint8Array, contentEncoding: string | null, hash: string, size: number): import("./embedded-store-types.d.ts").EmbeddedStoreEntry;
