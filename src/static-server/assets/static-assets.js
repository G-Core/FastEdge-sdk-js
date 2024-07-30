import { createAssetCache } from './asset-cache.js';
import { createWasmInlineAsset } from './asset-loader.js';

/**
 * @typedef {Object} FileInfo
 * @property {string} hash - Same as hash of file.
 * @property {number} size - Size of the file.
 * @property {string} assetPath - Path to the asset.
 * @property {number} lastModifiedTime - Last modified time as Unix time.
 */

/**
 * @typedef {Object} StaticAssetMetadata
 * @property {string} type - Type of the asset.
 * @property {string} assetKey - Key of the asset.
 * @property {string} contentType - Content type of the asset.
 // * @property {boolean} text - Indicates if the asset is text.
 * @property {FileInfo} fileInfo - Information about the file.
 * @property {number} lastModifiedTime - Farq: need to remove this, should be on file.
 */

/**
 * @typedef {Object} StaticAsset
 * @property {string} type - Type of the asset.
 * @property {string} assetKey - Key of the asset.
 * @property {function(): StaticAssetMetadata} getMetadata - Gets the metadata of the asset.
 * @property {function(unknown): Promise<import('./embedded-store-entry.js').EmbeddedStoreEntry>} getStoreEntry - Gets the store entry of the asset.
 */

/**
 * @typedef {Object.<string, StaticAssetMetadata>} StaticAssetManifest
 */

/**
 * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
 * This StaticAssetCache will be stored in the binary during wizer proccessing.
 *
 * @param {StaticAssetManifest} staticAssetManifest
 * @returns {import('./asset-cache.js').AssetCache} AssetCache
 */

function createStaticAssetsCache(staticAssetManifest) {
  /**
   * @type {Record<string, (metadata: StaticAssetMetadata) => import('./asset-cache.js').AssetCache>}
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
