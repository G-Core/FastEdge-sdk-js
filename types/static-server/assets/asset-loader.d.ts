/**
 *
 * @param {import('./static-assets.js').StaticAssetMetadata} metadata
 * @returns
 */
export function createWasmInlineAsset(metadata: import("./static-assets.js").StaticAssetMetadata): {
    assetKey: () => string;
    getStoreEntry: () => Promise<import("./embedded-store-entry.js").EmbeddedStoreEntry>;
    getMetadata: () => {
        /**
         * - Type of the asset.
         */
        type: string;
        /**
         * - Key of the asset.
         */
        assetKey: string;
        /**
         * - Content type of the asset.
         */
        contentType: string;
        /**
         * - Indicates if the asset is text.
         */
        text: boolean;
        /**
         * - Information about the file.
         */
        fileInfo: import("./static-assets.js").FileInfo;
        /**
         * - Farq: need to remove this, should be on file.
         */
        lastModifiedTime: number;
    };
};
