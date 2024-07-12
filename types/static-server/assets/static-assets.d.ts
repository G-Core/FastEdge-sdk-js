export type FileInfo = {
    /**
     * - Same as hash of file.
     */
    hash: string;
    /**
     * - Size of the file.
     */
    size: number;
    /**
     * - Path to the asset.
     */
    assetPath: string;
    /**
     * - Farq: need to remove this....
     */
    staticFilePath: string;
    /**
     * - Last modified time as Unix time.
     */
    lastModifiedTime: number;
};
export type StaticAssetMetadata = {
    /**
     * - Type of the asset.
     */
    type: string;
    /**
     * - Key of the asset.
     */
    assetKey: string;
    /**
     * - Content type of the asset.
     */
    contentType: string;
    /**
     * - Indicates if the asset is text.
     */
    text: boolean;
    /**
     * - Information about the file.
     */
    fileInfo: FileInfo;
    /**
     * - Farq: need to remove this, should be on file.
     */
    lastModifiedTime: number;
};
export type StaticAsset = {
    /**
     * - Type of the asset.
     */
    type: string;
    /**
     * - Key of the asset.
     */
    assetKey: string;
    /**
     * - Gets the metadata of the asset.
     */
    getMetadata: () => StaticAssetMetadata;
    /**
     * - Gets the store entry of the asset.
     */
    getStoreEntry: (arg0: unknown) => Promise<import("./embedded-store-entry.js").EmbeddedStoreEntry>;
};
export type StaticAssetManifest = {
    [x: string]: StaticAssetMetadata;
};
/**
 * @typedef {Object} FileInfo
 * @property {string} hash - Same as hash of file.
 * @property {number} size - Size of the file.
 * @property {string} assetPath - Path to the asset.
 * @property {string} staticFilePath - Farq: need to remove this....
 * @property {number} lastModifiedTime - Last modified time as Unix time.
 */
/**
 * @typedef {Object} StaticAssetMetadata
 * @property {string} type - Type of the asset.
 * @property {string} assetKey - Key of the asset.
 * @property {string} contentType - Content type of the asset.
 * @property {boolean} text - Indicates if the asset is text.
 * @property {FileInfo} fileInfo - Information about the file.
 * @property {number} lastModifiedTime - Farq: need to remove this, should be on file.
 */
/**
 * @typedef {Object} StaticAsset
 * @property {string} type - Type of the asset.
 * @property {string} assetKey - Key of the asset.
 * @property {function(): StaticAssetMetadata} getMetadata - Gets the metadata of the asset.
 * @property {function(unknown): Promise<import('./embedded-store-entry.js').EmbeddedStoreEntry>} getStoreEntry - Gets the store entry of the asset.
 */
/**
 * @typedef {Object.<string, StaticAssetMetadata>} StaticAssetManifest
 */
/**
 * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
 * This StaticAssetCache will be stored in the binary during wizer proccessing.
 *
 * @param {StaticAssetManifest} staticAssetManifest
 * @returns {import('./asset-cache.js').AssetCache} AssetCache
 */
export function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): import("./asset-cache.js").AssetCache;
