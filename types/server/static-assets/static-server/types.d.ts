import { ContentCompressionTypes, StaticAsset } from '../asset-loader/inline-asset/inline-asset.ts';
interface ServerConfig extends Record<string, unknown> {
    extendedCache: Array<string | RegExp>;
    publicDirPrefix: string;
    routePrefix?: string;
    compression: string[];
    notFoundPage: string | null;
    autoExt: string[];
    autoIndex: string[];
    spaEntrypoint: string | null;
}
/**
 * Represents the type of headers.
 */
type HeadersType = Record<string, string>;
/**
 * Represents the initialization options for an asset.
 */
interface AssetInit {
    status?: number;
    headers?: HeadersType;
    cache?: 'extended' | 'never' | null;
}
/**
 * Represents the static server.
 */
interface StaticServer {
    serveRequest(request: Request): Promise<void | Response>;
    readFileString(path: string): Promise<string>;
}
interface InternalStaticServer extends StaticServer {
    getMatchingAsset(path: string): StaticAsset | null;
    findAcceptEncodings(request: Request): Array<ContentCompressionTypes>;
    testExtendedCache(pathname: string): boolean;
    handlePreconditions(request: Request, asset: StaticAsset, responseHeaders: HeadersType): Response | null;
    serveAsset(request: Request, asset: StaticAsset, init?: AssetInit): Promise<Response>;
}
export type { AssetInit, HeadersType, InternalStaticServer, ServerConfig, StaticServer };
