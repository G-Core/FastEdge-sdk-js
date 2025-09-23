import type { AssetCacheConfig, StaticAssetManifest } from './types.ts';
/**
 * Creates a Static Asset Manifest file. This is a pre-build step that generates a manifest of all static assets to be included in the build.
 * This `StaticAssetManifest` will be used to create an in memory StaticAssetCache stored in the binary during Wizer processing.
 *
 * @param assetCacheConfig - The configuration for what files to include.
 * @returns An `AssetCache` instance containing the static assets.
 */
declare function createStaticAssetsManifest(asssetCacheConfig: Partial<AssetCacheConfig>): Promise<StaticAssetManifest>;
export { createStaticAssetsManifest };
export type { StaticAssetManifest } from './types.ts';
