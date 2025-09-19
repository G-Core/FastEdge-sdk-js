import type { ServerConfig, StaticServer } from './types.ts';
import type { StaticAssetManifest } from '~static-assets/asset-loader/create-static-assets-cache.ts';
/**
 * Creates a static server instance, able to serve static assets.
 *
 * @param staticAssetManifest - The StaticAssetManifest generated from "npx fastedge-assets".
 * @param serverConfig - The server configuration.
 * @returns A `StaticServer` instance.
 */
declare const createStaticServer: (staticAssetManifest: StaticAssetManifest, serverConfig: Partial<ServerConfig>) => StaticServer;
export { createStaticServer };
export type { ServerConfig, StaticServer } from './types.ts';
export type { StaticAssetManifest } from '~static-assets/asset-loader/create-static-assets-cache.ts';
