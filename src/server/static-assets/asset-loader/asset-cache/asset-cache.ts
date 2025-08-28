import type { AssetCache } from './types.ts';

import { deepCopy } from '~utils/deep-copy.ts';

/**
 * Creates an asset cache.
 * @param assets - Initial assets to populate the cache.
 * @returns An instance of `AssetCache`.
 */
const createAssetCache = <T>(assets: Record<string, T> = {}): AssetCache<T> => {
  /**
   * The assets stored in the cache.
   */
  const _assets: Record<string, T> = deepCopy(assets);

  return {
    loadAsset: (assetKey: string, asset: T): void => {
      _assets[assetKey] = deepCopy(asset);
    },

    getAsset: (assetKey: string): T | null => deepCopy(_assets[assetKey]) ?? null,

    getAssetKeys: (): string[] => Object.keys(_assets),
  };
};

export { createAssetCache };
export type { AssetCache } from './types.ts';
