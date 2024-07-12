/// <reference path="globals.d.ts" />
/// <reference path="fastedge:fs.d.ts" />
/// <reference path="fastedge:env.d.ts" />
/// <reference path="static-server.d.ts" />

import { AssetCache } from 'types/assets/asset-cache';
// import { StaticAssetManifest } from 'types/assets/static-asset';
// import { StaticServer } from 'types/index';

declare module '@gcoredev/fastedge-sdk-js' {
  // export { AssetCache } from 'types/assets/asset-cache';
  // export { StaticAssetManifest } from 'types/assets/static-asset';
  // export { StaticServer } from 'types/index';
  export { AssetCache };
  export function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache;
  // todo: fix this unknown
  export function getStaticServer(serverConfig: unknown, assetCache: AssetCache): StaticServer;
}
