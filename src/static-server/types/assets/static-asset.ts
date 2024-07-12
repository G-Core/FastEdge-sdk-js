import { EmbeddedStoreEntry } from './embedded-store-entry';

// todo: create a Fastedge version of this fileInfo
export type FileInfo = {
  hash: string; // same as hash of file
  size: number;
  staticFilePath: string; // ? remove this - not needed
  assetPath: string;
  lastModifiedTime: number; // as unix time
};

export type StaticAssetManifest = Record<string, StaticAssetMetadata>;

export type StaticAssetMetadata = {
  type: string;
  assetKey: string;
  contentType: string;
  text: boolean;
  lastModifiedTime: number; // ? remove this - not needed
  fileInfo: FileInfo;
};

export interface StaticAsset {
  readonly type: string;
  // farq: I think we can remove these, everything is being inlined at present.
  // text/json/bytes etc comes from kvStore implementation
  // readonly isLocal: boolean;
  // getBytes(): Uint8Array;
  // getText(): string;
  // getJson<T = unknown>(): T;
  readonly assetKey: string;
  getMetadata(): StaticAssetMetadata;
  // getStoreEntry(acceptEncodingsGroups?: ContentCompressionTypes[][]): Promise<StoreEntry>;
  getStoreEntry(acceptEncodingsGroups?: unknown): Promise<EmbeddedStoreEntry>;
}
