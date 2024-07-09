interface MetadataMap {
  assetKey: string;
  contentType: string;
  text: boolean;
  lastModifiedTime: number; // as unix time
  fileInfo: TFileInfo;
  compressedFileInfos: CompressedFileInfos<TFileInfo>;
}
