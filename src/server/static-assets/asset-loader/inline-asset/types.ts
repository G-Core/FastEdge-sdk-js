import type { EmbeddedStoreEntry } from '../embedded-store-entry/embedded-store-entry.ts';

type ContentCompressionTypes = 'br' | 'gzip';

/**
 * Represents the source and metadata of an asset.
 */
interface SourceAndInfo {
  source: Uint8Array;
  hash: string;
  size: number;
}

/**
 * Represents information about a file.
 */
interface FileInfo {
  hash: string; // Same as the hash of the file
  size: number; // Size of the file
  assetPath: string; // Path to the asset
  lastModifiedTime: number; // Last modified time as Unix time
}

/**
 * Represents metadata for an inlined static asset.
 */
interface StaticAssetMetadata {
  type: string; // Type of the asset
  assetKey: string; // Key of the asset
  contentType: string; // Content type of the asset
  fileInfo: FileInfo; // Information about the file
  isText: boolean; // Indicates if the asset is text
}

/**
 * Represents an inlined static asset.
 */
interface StaticAsset {
  type: string; // Type of the asset
  assetKey: string; // Key of the asset
  getMetadata(): StaticAssetMetadata; // Gets the metadata of the asset
  getEmbeddedStoreEntry(arg: unknown): Promise<EmbeddedStoreEntry>; // Gets the store entry of the asset
  getText(): string; // Gets the text content of the asset
}

export type { ContentCompressionTypes, SourceAndInfo, StaticAsset, StaticAssetMetadata };
