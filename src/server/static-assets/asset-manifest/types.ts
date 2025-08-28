import { ContentTypeDefinition } from '../../../utils/content-types.ts';

interface AssetCacheConfig extends Record<string, unknown> {
  ignoreDotFiles: boolean;
  ignoreWellKnown: boolean;
  ignorePaths: string[];
  inputPath: string;
  contentTypes: Array<ContentTypeDefinition>;
  outputPath: string;
}

export type { AssetCacheConfig };
export type { StaticAssetManifest } from '../asset-loader/types.ts';
