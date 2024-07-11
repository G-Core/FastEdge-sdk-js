import { createAssetCache } from './asset-cache';
import { createWasmInlineAsset } from './asset-loader';

/**
 * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
 * This StaticAssetCache will be stored in the binary during wizer proccessing.
 *
 * @param {import('./static-asset-types.d.ts').StaticAssetManifest} staticAssetManifest
 * @returns {import('./asset-cache-types.d.ts').AssetCache} AssetCache
 */

function createStaticAssetsCache(staticAssetManifest) {
  /**
   * @type {Record<string, (metadata: import('./static-asset-types.d.ts').StaticAssetMetadata) => import('./asset-cache-types.d.ts').AssetCache>}
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
