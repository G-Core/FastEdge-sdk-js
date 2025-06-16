/**
 * Resolves the path to a file within the NPX package.
 * @param filePath - The file path to resolve.
 * @returns The resolved NPX package path.
 */
declare const npxPackagePath: (filePath: string) => string;
/**
 * Creates a temporary directory.
 * @returns The path to the temporary directory.
 */
declare const getTmpDir: () => Promise<string>;
/**
 * Resolves the path to a temporary file.
 * @param filePath - The base path for the temporary file.
 * @returns The resolved path to the temporary file.
 */
declare const resolveTmpDir: (filePath: string) => string;
/**
 * Normalizes and resolves the path for Unix/Windows compatibility.
 * @param base - The base path.
 * @param providedPath - The provided path to normalize.
 * @returns The normalized and resolved path.
 */
declare const resolveOsPath: (base: string, providedPath: string) => string;
/**
 * Converts a path to Unix-compatible format.
 * @param path - The path to convert.
 * @returns The Unix-compatible path.
 */
declare const useUnixPath: (path: string) => string;
export { getTmpDir, npxPackagePath, resolveOsPath, resolveTmpDir, useUnixPath };
