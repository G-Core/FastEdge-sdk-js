import { createAssetCache } from './asset-cache.ts';
import { createWasmInlineAsset } from './asset-loader.ts';

import type { EmbeddedStoreEntry } from './embedded-store-entry.ts';
import type { AssetCache } from './asset-cache.ts';

/**
 * Represents information about a file.
 */
interface FileInfo {
  hash: string; // Same as the hash of the file
  size: number; // Size of the file
  assetPath: string; // Path to the asset
  lastModifiedTime: number; // Last modified time as Unix time
}

// @property {boolean} text - Indicates if the asset is text.

/**
 * Represents metadata for a static asset.
 */
interface StaticAssetMetadata {
  type: string; // Type of the asset
  assetKey: string; // Key of the asset
  contentType: string; // Content type of the asset
  fileInfo: FileInfo; // Information about the file
}

/**
 * Represents a static asset.
 */
interface StaticAsset {
  type: string; // Type of the asset
  assetKey: string; // Key of the asset
  getMetadata(): StaticAssetMetadata; // Gets the metadata of the asset
  getStoreEntry(arg: unknown): Promise<EmbeddedStoreEntry>; // Gets the store entry of the asset
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

function createStaticAssetsCache(
  staticAssetManifest: StaticAssetManifest,
): AssetCache<StaticAsset> {
  // Define loaders for different asset types
  const assetLoaders: Record<string, (metadata: StaticAssetMetadata) => StaticAsset> = {
    'wasm-inline': (metadata) => createWasmInlineAsset(metadata),
  };

  const staticAssetsCache = createAssetCache<StaticAsset>({});

  for (const [assetKey, metadata] of Object.entries(staticAssetManifest)) {
    if (!(metadata.type in assetLoaders)) {
      throw new Error(`Unknown content asset type '${metadata.type}'`);
    }
    const asset = assetLoaders[metadata.type](metadata);

    staticAssetsCache.loadAsset(assetKey, asset);
  }

  return staticAssetsCache;
}

export { createStaticAssetsCache };
export type { FileInfo, StaticAssetMetadata, StaticAsset, StaticAssetManifest };
