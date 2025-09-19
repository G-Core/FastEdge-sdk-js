import { createAssetCache } from './asset-cache/asset-cache.ts';
import { createWasmInlineAsset } from './inline-asset/inline-asset.ts';

import type { AssetCache } from './asset-cache/asset-cache.ts';
import type { StaticAsset, StaticAssetMetadata } from './inline-asset/inline-asset.ts';
import type { StaticAssetManifest } from './types.ts';

/**
 * Creates an object that contains all static assets in memory, with setters and getters for each asset/metadata.
 * This `StaticAssetCache` will be stored in the binary during Wizer processing.
 *
 * @param assetCacheConfig - The configuration for what files to include.
 * @returns An `AssetCache` instance containing the static assets.
 */

function createStaticAssetsCache(
  staticAssetManifest: StaticAssetManifest,
): AssetCache<StaticAsset> {
  // Define loaders for different asset types
  const assetLoaders: Record<string, (metadata: StaticAssetMetadata) => StaticAsset> = {
    'wasm-inline': (metadata) => createWasmInlineAsset(metadata),
  };

  const staticAssetsCache = createAssetCache<StaticAsset>({});

  for (const [assetKey, metadata] of Object.entries(staticAssetManifest)) {
    if (!(metadata.type in assetLoaders)) {
      throw new Error(`Unknown content asset type '${metadata.type}'`);
    }
    const asset = assetLoaders[metadata.type](metadata);

    staticAssetsCache.loadAsset(assetKey, asset);
  }

  return staticAssetsCache;
}

export { createStaticAssetsCache };
export type { StaticAssetManifest } from './types.ts';
