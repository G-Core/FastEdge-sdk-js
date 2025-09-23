import type { StaticAsset, StaticAssetMetadata } from './types.ts';
/**
 * Creates an inline WASM asset.
 *
 * @param metadata - The metadata of the asset.
 * @returns An object representing the inline WASM asset.
 */
declare const createWasmInlineAsset: (metadata: StaticAssetMetadata) => StaticAsset;
export { createWasmInlineAsset };
export type { ContentCompressionTypes, StaticAsset, StaticAssetMetadata } from './types.ts';
