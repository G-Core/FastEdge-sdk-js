/**
 * @typedef {Object} AssetCache
 * @property {function(string): any | null} getAsset - Retrieves an asset by its key.
 * @property {function(): string[]} getAssetKeys - Retrieves all asset keys.
 * @property {function(string, any): void} loadAsset - Loads an asset with a given key.
 */

/**
 * Creates an asset cache.
 * @template AssetType
 * @param {Object.<string, AssetType>} [assets={}] - Initial assets to populate the cache.
 * @returns {AssetCache} AssetCache
 */
const createAssetCache = (assets = {}) => {
  /**
   * The assets stored in the cache.
   * @type {Object.<string, AssetType>}
   */
  const _assets = assets;

  return {
    loadAsset: (assetKey, asset) => {
      _assets[assetKey] = asset;
    },

    getAsset: (assetKey) => _assets[assetKey] ?? null,

    getAssetKeys: () => Object.keys(_assets),
  };
};

export { createAssetCache };
