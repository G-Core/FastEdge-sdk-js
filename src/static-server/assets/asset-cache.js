/**
 * Creates an asset cache.
 * @template AssetType
 * @param {Object.<string, AssetType>} [assets={}] - Initial assets to populate the cache.
 * @returns {import('../types/').AssetCache} AssetCache
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
