export interface AssetCache {
  getAsset(assetKey: string): any | null;
  getAssetKeys(): string[];
  loadAsset(assetKey: string, asset: any): void;
}
