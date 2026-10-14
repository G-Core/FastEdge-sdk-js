import type { AssetCacheConfig, StaticAssetManifest } from './types.ts';
/**
 * Creates a manifest file map based on the provided configuration.
 * @param config - The configuration for creating the manifest file map.
 * @returns The static asset manifest.
 */
declare function createManifestFileMap(asssetCacheConfig: AssetCacheConfig): StaticAssetManifest;
export { createManifestFileMap };
