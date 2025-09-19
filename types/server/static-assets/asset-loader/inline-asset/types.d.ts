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
    hash: string;
    size: number;
    assetPath: string;
    lastModifiedTime: number;
}
/**
 * Represents metadata for an inlined static asset.
 */
interface StaticAssetMetadata {
    type: string;
    assetKey: string;
    contentType: string;
    fileInfo: FileInfo;
}
/**
 * Represents an inlined static asset.
 */
interface StaticAsset {
    type: string;
    assetKey: string;
    getMetadata(): StaticAssetMetadata;
    getStoreEntry(arg: unknown): Promise<EmbeddedStoreEntry>;
}
export type { ContentCompressionTypes, SourceAndInfo, StaticAsset, StaticAssetMetadata };
