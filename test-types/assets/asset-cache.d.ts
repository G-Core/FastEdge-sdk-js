/**
 * Creates an asset cache.
 * @template AssetType
 * @param {Object.<string, AssetType>} [assets={}] - Initial assets to populate the cache.
 * @returns {import('./asset-cache-types.d.ts').AssetCache} AssetCache
 */
export function createAssetCache<AssetType>(assets?: {
    [x: string]: AssetType;
} | undefined): import("./asset-cache-types.d.ts").AssetCache;
