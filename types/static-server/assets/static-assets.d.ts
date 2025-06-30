import type { AssetCache } from './asset-cache.ts';
import type { EmbeddedStoreEntry } from './embedded-store-entry.ts';
/**
 * Represents information about a file.
 */
interface FileInfo {
    hash: string;
    size: number;
    assetPath: string;
    lastModifiedTime: number;
}
/**
 * Represents metadata for a static asset.
 */
interface StaticAssetMetadata {
    type: string;
    assetKey: string;
    contentType: string;
    fileInfo: FileInfo;
}
/**
 * Represents a static asset.
 */
interface StaticAsset {
    type: string;
    assetKey: string;
    getMetadata(): StaticAssetMetadata;
    getStoreEntry(arg: unknown): Promise<EmbeddedStoreEntry>;
}
/**
 * Represents a manifest of static assets.
 */
type StaticAssetManifest = Record<string, StaticAssetMetadata>;
/**
 * Creates an object that contains all static assets in memory, with setters and getters for each asset/metadata.
 * This `StaticAssetCache` will be stored in the binary during Wizer processing.
 *
 * @param staticAssetManifest - The manifest of static assets.
 * @returns An `AssetCache` instance containing the static assets.
 */
declare function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache<StaticAsset>;
export { createStaticAssetsCache };
export type { FileInfo, StaticAssetMetadata, StaticAsset, StaticAssetManifest };
