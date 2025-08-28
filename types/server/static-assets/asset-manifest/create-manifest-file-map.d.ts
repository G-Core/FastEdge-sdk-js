import type { AssetCacheConfig, StaticAssetManifest } from './types.ts';
/**
 * Create a readable string from an object on a single line.
 * @param obj - The object to stringify.
 * @returns The stringified object.
 */
declare function prettierObjectString(obj: object): string;
/**
 * Creates a manifest file map based on the provided configuration.
 * @param config - The configuration for creating the manifest file map.
 * @returns The static asset manifest.
 */
declare function createManifestFileMap(asssetCacheConfig: AssetCacheConfig): StaticAssetManifest;
export { createManifestFileMap, prettierObjectString };
