import type { EmbeddedStoreEntry } from './types.ts';
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
export type { EmbeddedStoreEntry } from './types.ts';
