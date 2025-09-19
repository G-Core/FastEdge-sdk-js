import type { AssetCache } from './types.ts';
/**
 * Creates an asset cache.
 * @param assets - Initial assets to populate the cache.
 * @returns An instance of `AssetCache`.
 */
declare const createAssetCache: <T>(assets?: Record<string, T>) => AssetCache<T>;
export { createAssetCache };
export type { AssetCache } from './types.ts';
