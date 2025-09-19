/**
 * Represents a cache for assets.
 */
interface AssetCache<T> {
    /**
     * Retrieves an asset by its key.
     * @param assetKey - The key of the asset to retrieve.
     * @returns The asset associated with the key, or `null` if not found.
     */
    getAsset(assetKey: string): T | null;
    /**
     * Retrieves all asset keys.
     * @returns An array of all asset keys.
     */
    getAssetKeys(): string[];
    /**
     * Loads an asset into the cache with a given key.
     * @param assetKey - The key to associate with the asset.
     * @param asset - The asset to load into the cache.
     */
    loadAsset(assetKey: string, asset: T): void;
}
export type { AssetCache };
