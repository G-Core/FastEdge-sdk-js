interface TFileInfo {
  size: number;
  lastModifiedTime: number; // as unix time
  hash: string;
}

interface MetadataMap {
  assetKey: string;
  contentType: string;
  text: boolean;
  lastModifiedTime: number; // as unix time
  fileInfo: TFileInfo;
  // compressedFileInfos: CompressedFileInfos<TFileInfo>;
  compressedFileInfos: any;
}
