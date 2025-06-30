/// <reference path="fastedge-env.d.ts" />
/// <reference path="fastedge-fs.d.ts" />
/// <reference path="fastedge-secret.d.ts" />
/// <reference path="globals.d.ts" />

export { createStaticAssetsCache, getStaticServer } from './static-server/index.ts';
export type { AssetCache, StaticAssetManifest, StaticServer } from './static-server/index.ts';
