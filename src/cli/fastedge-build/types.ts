import type { AssetCacheConfig } from '~static-assets/asset-manifest/types.ts';

enum BuildType {
  Static = 'static',
  Http = 'http',
}

interface BuildConfig extends Partial<AssetCacheConfig> {
  type?: BuildType;
  entryPoint: string;
  wasmOutput: string;
}

export type { BuildConfig, BuildType };
