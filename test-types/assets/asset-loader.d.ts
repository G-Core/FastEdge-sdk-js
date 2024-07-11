/**
 *
 * @param {import('./static-asset-types.d.ts').StaticAssetMetadata} metadata
 * @returns
 */
export function createWasmInlineAsset(metadata: import("./static-asset-types.d.ts").StaticAssetMetadata): {
    assetKey: () => string;
    getStoreEntry: () => Promise<import("./embedded-store-types").EmbeddedStoreEntry>;
    getMetadata: () => {
        type: string;
        assetKey: string;
        contentType: string;
        text: boolean;
        lastModifiedTime: number;
        fileInfo: import("./static-asset-types.d.ts").FileInfo;
    };
};
