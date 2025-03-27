export type AssetCache = {
    /**
     * - Retrieves an asset by its key.
     */
    getAsset: (arg0: string) => any | null;
    /**
     * - Retrieves all asset keys.
     */
    getAssetKeys: () => string[];
    /**
     * - Loads an asset with a given key.
     */
    loadAsset: (arg0: string, arg1: any) => void;
};
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
export function createAssetCache<AssetType>(assets?: {
    [x: string]: AssetType;
}): AssetCache;
