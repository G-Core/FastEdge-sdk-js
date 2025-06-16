/**
 * Represents a cache for assets.
 */
interface AssetCache<AssetType> {
    /**
     * Retrieves an asset by its key.
     * @param assetKey - The key of the asset to retrieve.
     * @returns The asset associated with the key, or `null` if not found.
     */
    getAsset(assetKey: string): AssetType | null;
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
    loadAsset(assetKey: string, asset: AssetType): void;
}
/**
 * Creates an asset cache.
 * @template AssetType - The type of assets stored in the cache.
 * @param assets - Initial assets to populate the cache.
 * @returns An instance of `AssetCache`.
 */
declare const createAssetCache: <AssetType>(assets?: Record<string, AssetType>) => AssetCache<AssetType>;
export { createAssetCache };
export type { AssetCache };
