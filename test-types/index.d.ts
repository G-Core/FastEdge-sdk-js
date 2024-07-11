/**
 * The server able to serve static assets.
 * @param {unknown} serverConfig
 * @param {import('./assets/asset-cache-types.d.ts').AssetCache} assetCache
 * @returns {import('./static-server-types.d.ts').StaticServer} StaticServer
 */
export function getStaticServer(serverConfig: unknown, assetCache: import("./assets/asset-cache-types.d.ts").AssetCache): import("./static-server-types.d.ts").StaticServer;
