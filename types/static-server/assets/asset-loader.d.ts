import type { StaticAsset, StaticAssetMetadata } from './static-assets.ts';
/**
 * Represents the source and metadata of an asset.
 */
interface SourceAndInfo {
    source: Uint8Array;
    hash: string;
    size: number;
}
/**
 * Creates an inline WASM asset.
 *
 * @param metadata - The metadata of the asset.
 * @returns An object representing the inline WASM asset.
 */
declare const createWasmInlineAsset: (metadata: StaticAssetMetadata) => StaticAsset;
export { createWasmInlineAsset };
export type { SourceAndInfo };
