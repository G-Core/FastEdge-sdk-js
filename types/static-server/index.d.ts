import type { StaticAsset } from './assets/static-assets.ts';
import type { AssetCache } from './assets/asset-cache.ts';
/**
 * Represents the type of headers.
 */
type HeadersType = Record<string, string>;
/**
 * Represents the supported content compression types.
 */
type ContentCompressionTypes = 'br' | 'gzip';
/**
 * Represents the initialization options for an asset.
 */
interface AssetInit {
    status?: number;
    headers?: HeadersType;
    cache?: 'extended' | 'never' | null;
}
/**
 * Represents the configuration for the static server.
 */
interface ServerConfig {
    spaEntrypoint: string | null;
    notFoundPage: string | null;
    publicDirPrefix: string;
    extendedCache: Array<string | RegExp>;
    autoIndex: Array<string>;
    autoExt: Array<string>;
    compression: Array<ContentCompressionTypes>;
}
/**
 * Represents the static server.
 */
interface StaticServer {
    getMatchingAsset(path: string): StaticAsset | null;
    findAcceptEncodings(request: Request): Array<ContentCompressionTypes>;
    testExtendedCache(pathname: string): boolean;
    handlePreconditions(request: Request, asset: StaticAsset, responseHeaders: HeadersType): Response | null;
    serveAsset(request: Request, asset: StaticAsset, init?: AssetInit): Promise<Response>;
    serveRequest(request: Request): Promise<Response | null>;
}
/**
 * Creates a static server instance, able to serve static assets.
 *
 * @param serverConfig - The server configuration.
 * @param assetCache - The asset cache.
 * @returns A `StaticServer` instance.
 */
declare const getStaticServer: (serverConfig: ServerConfig, assetCache: AssetCache<StaticAsset>) => StaticServer;
export { getStaticServer };
export { createStaticAssetsCache } from './assets/static-assets.ts';
export type { StaticAssetManifest } from './assets/static-assets.ts';
export type { AssetCache, AssetInit, ContentCompressionTypes, HeadersType, ServerConfig, StaticServer, };
