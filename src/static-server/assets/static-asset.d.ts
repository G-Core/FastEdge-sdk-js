export type FileInfo = {
  hash: string; // same as hash of file
  size: number;
};

export type StaticAssetMetadata = {
  type: string;
  assetKey: string;
  contentType: string;
  text: boolean;
  lastModifiedTime: number; // as unix time
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
  getStoreEntry(acceptEncodingsGroups?: ContentCompressionTypes[][]): Promise<StoreEntry>;
}

export type AssetBuilderContext = any;
