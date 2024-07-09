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
  readonly isLocal: boolean;
  readonly assetKey: string;
  getMetadata(): StaticAssetMetadata;
  getStoreEntry(
    acceptEncodingsGroups?: ContentCompressionTypes[][]
  ): Promise<StoreEntry>;
  getBytes(): Uint8Array;
  getText(): string;
  getJson<T = unknown>(): T;
}

export type AssetBuilderContext = any;
