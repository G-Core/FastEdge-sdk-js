import type { AssetCacheConfig } from '~static-assets/asset-manifest/types.ts';

enum BuildType {
  Static = 'static',
  Http = 'http',
}

interface BuildConfig extends Partial<AssetCacheConfig> {
  type?: BuildType;
  entryPoint: string;
  wasmOutput: string;
  tsConfigPath?: string;
  /**
   * Wasm components to compose into the app, keyed by the WIT interface the app imports:
   * `{ 'acme:imageopt/optimise': './imageopt.wasm' }`. Paths are relative to the cwd.
   */
  components?: Record<string, string>;
}

export type { BuildConfig, BuildType };
