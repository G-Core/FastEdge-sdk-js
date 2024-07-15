/// <reference path="globals.d.ts" />
/// <reference path="fastedge:fs.d.ts" />
/// <reference path="fastedge:env.d.ts" />

import { AssetCache } from './static-server/assets/asset-cache.d.ts';
import { StaticAssetManifest } from './static-server/assets/static-assets.d.ts';
import { StaticServer } from './static-server/index.d.ts';
declare module '@gcoredev/fastedge-sdk-js' {
  export function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache;
  export function getStaticServer(serverConfig: unknown, assetCache: AssetCache): StaticServer;
}
