import type { ServerConfig, StaticServer } from './types.ts';
import type { AssetCache } from '~static-assets/asset-loader/asset-cache/asset-cache.ts';
import type { StaticAsset } from '~static-assets/asset-loader/inline-asset/inline-asset.ts';
/**
 * Creates a static server instance, able to serve static assets.
 *
 * @param serverConfig - The server configuration.
 * @param assetCache - The asset cache.
 * @returns A `StaticServer` instance.
 */
declare const getStaticServer: <T = StaticServer>(serverConfig: ServerConfig, assetCache: AssetCache<StaticAsset>) => T;
export { getStaticServer };
