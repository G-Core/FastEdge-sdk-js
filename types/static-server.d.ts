declare module "types/assets/asset-cache" {
    export interface AssetCache {
        getAsset(assetKey: string): any | null;
        getAssetKeys(): string[];
        loadAsset(assetKey: string, asset: any): void;
    }
}
declare module "types/assets/embedded-store-entry" {
    export interface ByteReadableStream extends ReadableStream<Uint8Array> {
        getReader: () => any;
        isLocked: () => boolean;
        isDisturbed: () => boolean;
    }
    export interface EmbeddedStoreEntry {
        body(): ByteReadableStream | null;
        bodyUsed(): boolean;
        arrayBuffer(): Promise<ArrayBuffer>;
        contentEncoding(): string | null;
        hash(): string;
        size(): number;
    }
}
declare module "types/assets/static-asset" {
    import { EmbeddedStoreEntry } from "types/assets/embedded-store-entry";
    export type FileInfo = {
        hash: string;
        size: number;
        staticFilePath: string;
    };
    export type StaticAssetManifest = Record<string, StaticAssetMetadata>;
    export type StaticAssetMetadata = {
        type: string;
        assetKey: string;
        contentType: string;
        text: boolean;
        lastModifiedTime: number;
        fileInfo: FileInfo;
    };
    export interface StaticAsset {
        readonly type: string;
        readonly assetKey: string;
        getMetadata(): StaticAssetMetadata;
        getStoreEntry(acceptEncodingsGroups?: unknown): Promise<EmbeddedStoreEntry>;
    }
}
declare module "types/assets/index" {
    export * from "types/assets/asset-cache";
    export * from "types/assets/embedded-store-entry";
    export * from "types/assets/static-asset";
}
declare module "types/index" {
    import { StaticAsset } from "types/assets/index";
    export type HeadersType = Record<string, string>;
    export type ContentCompressionTypes = 'br' | 'gzip';
    export type AssetInit = {
        status?: number;
        headers?: Record<string, string>;
        cache?: 'extended' | 'never' | null;
    };
    export interface StaticServer {
        getMatchingAsset(pathname: string): StaticAsset | null;
        findAcceptEncodings(request: Request): Array<ContentCompressionTypes>;
        testExtendedCache(pathname: string): boolean;
        handlePreconditions(request: Request, asset: StaticAsset, responseHeaders: Record<string, string>): Response | null;
        serveAsset(request: Request, asset: StaticAsset, init?: AssetInit): Promise<Response>;
        serveRequest(request: Request): Promise<Response | null>;
    }
    export * from "types/assets/index";
}
declare module "utils/headers" {
    /**
     * @param {Record<string, string>} responseHeaders
     * @param {Readonly<string[]>} keys
     * @returns {Record<string, string>}
     */
    export function buildHeadersSubset(responseHeaders: Record<string, string>, keys: Readonly<string[]>): Record<string, string>;
    /**
     * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
     * @param {import('../types/').StaticAsset} asset
     * @param {number} ifModifiedSince
     * @returns {boolean}
     */
    export function checkIfModifiedSince(asset: import("types").StaticAsset, ifModifiedSince: number): boolean;
    /**
     * https://httpwg.org/specs/rfc9110.html#field.if-none-match
     * @param {string} etag
     * @param {Array<string>} headerValue
     * @returns {boolean}
     */
    export function checkIfNoneMatch(etag: string, headerValue: Array<string>): boolean;
    /**
     * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
     * @param {Request} request
     * @returns {number | null}
     */
    export function getIfModifiedSinceHeader(request: Request): number | null;
    /**
     * https://httpwg.org/specs/rfc9110.html#field.if-none-match
     * @param {Request} request
     * @returns {Array<string>}
     */
    export function getIfNoneMatchHeader(request: Request): Array<string>;
}
declare module "index" {
    /**
     * The server able to serve static assets.
     * @param {unknown} serverConfig
     * @param {import('./types/').AssetCache} assetCache
     * @returns {import('./types/').StaticServer} StaticServer
     */
    export function getStaticServer(serverConfig: unknown, assetCache: import("types").AssetCache): import("types").StaticServer;
}
declare module "assets/asset-cache" {
    /**
     * Creates an asset cache.
     * @template AssetType
     * @param {Object.<string, AssetType>} [assets={}] - Initial assets to populate the cache.
     * @returns {import('../types/').AssetCache} AssetCache
     */
    export function createAssetCache<AssetType>(assets?: {
        [x: string]: AssetType;
    } | undefined): import("types").AssetCache;
}
declare module "assets/embedded-store-entry" {
    /**
     * Provides a Body-style interface to Uint8Array.
     * The is for files that have been embedded using readFileSync
     * @param {Uint8Array} array
     * @param {string | null} contentEncoding
     * @param {string} hash
     * @param {number} size
     * @returns {import('../types/').EmbeddedStoreEntry} EmbeddedStoreEntry
     */
    export function createEmbeddedStoreEntry(array: Uint8Array, contentEncoding: string | null, hash: string, size: number): import("types").EmbeddedStoreEntry;
}
declare module "assets/asset-loader" {
    /**
     *
     * @param {import('../types/').StaticAssetMetadata} metadata
     * @returns
     */
    export function createWasmInlineAsset(metadata: import("types").StaticAssetMetadata): {
        assetKey: () => string;
        getStoreEntry: () => Promise<import("types").EmbeddedStoreEntry>;
        getMetadata: () => {
            type: string;
            assetKey: string;
            contentType: string;
            text: boolean;
            lastModifiedTime: number;
            fileInfo: import("types").FileInfo;
        };
    };
}
declare module "assets/static-assets" {
    /**
     * Create an object that contains all static assets in memory, with setters and getters for each asset/metadata
     * This StaticAssetCache will be stored in the binary during wizer proccessing.
     *
     * @param {import('../types/').StaticAssetManifest} staticAssetManifest
     * @returns {import('../types/').AssetCache} AssetCache
     */
    export function createStaticAssetsCache(staticAssetManifest: import("types").StaticAssetManifest): import("types").AssetCache;
}
