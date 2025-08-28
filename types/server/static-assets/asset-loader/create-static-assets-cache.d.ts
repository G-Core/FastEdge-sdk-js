import type { AssetCache } from './asset-cache/asset-cache.ts';
import type { StaticAsset } from './inline-asset/inline-asset.ts';
import type { StaticAssetManifest } from './types.ts';
/**
 * Creates an object that contains all static assets in memory, with setters and getters for each asset/metadata.
 * This `StaticAssetCache` will be stored in the binary during Wizer processing.
 *
 * @param assetCacheConfig - The configuration for what files to include.
 * @returns An `AssetCache` instance containing the static assets.
 */
declare function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache<StaticAsset>;
export { createStaticAssetsCache };
export type { StaticAssetManifest } from './types.ts';
