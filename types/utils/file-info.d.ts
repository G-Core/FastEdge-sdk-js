/**
 * Represents file information.
 */
interface FileInfo {
    size: number;
    hash: string;
    lastModifiedTime: number;
    assetPath: string;
}
/**
 * Creates a file info object with the size and hash of the file.
 * @param assetKey - The asset key for the file.
 * @param publicDir - The public directory where the file resides.
 * @param file - The path to the file.
 * @returns A `FileInfo` object containing the file's size, hash, last modified time, and asset path.
 */
declare function createFileInfo(assetKey: string, publicDir: string, file: string): FileInfo;
export { createFileInfo };
export type { FileInfo };
