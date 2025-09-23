import { getStaticServer } from './static-server.ts';

import type { ServerConfig, StaticServer } from './types.ts';
import type { StaticAssetManifest } from '~static-assets/asset-loader/create-static-assets-cache.ts';

import { createStaticAssetsCache } from '~static-assets/asset-loader/create-static-assets-cache.ts';
import { normalizeConfig } from '~utils/config-helpers.ts';

/**
 * Creates a static server instance, able to serve static assets.
 *
 * @param staticAssetManifest - The StaticAssetManifest generated from "npx fastedge-assets".
 * @param serverConfig - The server configuration.
 * @returns A `StaticServer` instance.
 */
const createStaticServer = (
  staticAssetManifest: StaticAssetManifest,
  serverConfig: Partial<ServerConfig>,
): StaticServer => {
  const normalizedServerConfig = normalizeServerConfig(serverConfig);
  const assetCache = createStaticAssetsCache(staticAssetManifest);
  return getStaticServer(normalizedServerConfig, assetCache);
};

function normalizeServerConfig(config: Partial<ServerConfig>): ServerConfig {
  return normalizeConfig<ServerConfig>(config, {
    publicDirPrefix: 'string',
    routePrefix: 'path',
    extendedCache: 'pathsOrRegexArray',
    compression: 'stringArray',
    notFoundPage: 'path',
    autoExt: 'stringArray',
    autoIndex: 'stringArray',
    spaEntrypoint: 'path',
  });
}

export { createStaticServer };

export type { ServerConfig, StaticServer } from './types.ts';
export type { StaticAssetManifest } from '~static-assets/asset-loader/create-static-assets-cache.ts';
