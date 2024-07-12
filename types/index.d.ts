/// <reference path="globals.d.ts" />
/// <reference path="fastedge:fs.d.ts" />
/// <reference path="fastedge:env.d.ts" />
/// <reference path="static-server.d.ts" />

import { AssetCache } from 'assets/asset-cache';
import { StaticAssetManifest } from 'assets/static-asset';
import { StaticServer } from 'assets/static-server';
declare module '@gcoredev/fastedge-sdk-js' {
  export function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache;
  export function createStaticAssetsCache(staticAssetManifest: StaticAssetManifest): AssetCache;
  // todo: fix this unknown
  export function getStaticServer(serverConfig: unknown, assetCache: AssetCache): StaticServer;
}
