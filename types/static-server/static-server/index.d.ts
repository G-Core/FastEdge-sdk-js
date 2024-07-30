export { createStaticAssetsCache } from "./assets/static-assets.js";
export type HeadersType = {
    [x: string]: string;
};
export type ContentCompressionTypes = "br" | "gzip";
export type AssetInit = {
    status?: number | undefined;
    headers?: {
        [x: string]: string;
    } | undefined;
    cache?: "never" | "extended" | null | undefined;
};
export type StaticServer = {
    getMatchingAsset: (arg0: string) => (import("./assets/static-assets.js").StaticAsset | null);
    findAcceptEncodings: (arg0: Request) => Array<ContentCompressionTypes>;
    testExtendedCache: (arg0: string) => boolean;
    handlePreconditions: (arg0: Request, arg1: import("./assets/static-assets.js").StaticAsset, arg2: {
        [x: string]: string;
    }) => (Response | null);
    serveAsset: (arg0: Request, arg1: import("./assets/static-assets.js").StaticAsset, arg2: AssetInit) => Promise<Response>;
    serveRequest: (arg0: Request) => Promise<(Response | null)>;
};
export type ServerConfig = {
    spaEntrypoint: string | null;
    notFoundPage: string | null;
    publicDirPrefix: string;
    staticItems: Array<string>;
    autoIndex: Array<string>;
    autoExt: Array<string>;
    compression: Array<ContentCompressionTypes>;
};
/**
 * The server able to serve static assets.
 * @param {ServerConfig} serverConfig
 * @param {import('./assets/asset-cache.js').AssetCache} assetCache
 * @returns {StaticServer} StaticServer
 */
export function getStaticServer(serverConfig: ServerConfig, assetCache: import("./assets/asset-cache.js").AssetCache): StaticServer;
