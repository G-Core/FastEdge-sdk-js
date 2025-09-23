import { ContentTypeDefinition } from '../../../utils/content-types.ts';
interface AssetCacheConfig extends Record<string, unknown> {
    publicDir: string;
    assetManifestPath: string;
    contentTypes: Array<ContentTypeDefinition>;
    ignoreDotFiles: boolean;
    ignorePaths: string[];
    ignoreWellKnown: boolean;
}
export type { AssetCacheConfig };
export type { StaticAssetManifest } from '../asset-loader/types.ts';
