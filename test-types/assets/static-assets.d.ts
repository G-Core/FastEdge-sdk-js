/**
 * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
 * This StaticAssetCache will be stored in the binary during wizer proccessing.
 *
 * @param {import('./static-asset-types.d.ts').StaticAssetManifest} staticAssetManifest
 * @returns {import('./asset-cache-types.d.ts').AssetCache} AssetCache
 */
export function createStaticAssetsCache(staticAssetManifest: import("./static-asset-types.d.ts").StaticAssetManifest): import("./asset-cache-types.d.ts").AssetCache;
