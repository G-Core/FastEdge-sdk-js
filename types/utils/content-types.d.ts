/**
 * Represents a content type definition.
 */
interface ContentTypeDefinition {
    test: RegExp | ((assetKey: string) => boolean);
    contentType: string;
    isText: boolean;
}
/**
 * Retrieves the default content types.
 * @returns An array of default content type definitions.
 */
/**
 * Retrieves known content types, combining custom and default content types.
 * @param customContentTypes - Custom content types to include.
 * @returns An array of known content type definitions.
 */
declare function getKnownContentTypes(customContentTypes: ContentTypeDefinition[]): ContentTypeDefinition[];
/**
 * Tests the content type of a file based on its asset key.
 * @param contentTypes - The content types to test against.
 * @param assetKey - The asset key to test.
 * @returns The matched content type or `null` if no match is found.
 */
declare function testFileContentType(contentTypes: ContentTypeDefinition[] | undefined, assetKey: string): {
    contentType: string;
    isText: boolean;
} | null;
export { getKnownContentTypes, testFileContentType };
export type { ContentTypeDefinition };
