import { createAssetCache } from './asset-cache';
import { createWasmInlineAsset } from './asset-loader';

/**
 * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
 * This StaticAssetCache will be stored in the binary during wizer proccessing.
 *
 * @param {import('../types/').StaticAssetManifest} staticAssetManifest
 * @returns {import('../types/').AssetCache} AssetCache
 */

function createStaticAssetsCache(staticAssetManifest) {
  /**
   * @type {Record<string, (metadata: import('../types/').StaticAssetMetadata) => import('../types/').AssetCache>}
   */
  const assetLoaders = {
    // @ts-ignore
    'wasm-inline': (metadata) => createWasmInlineAsset(metadata),
  };

  const staticAssetsCache = createAssetCache({});

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