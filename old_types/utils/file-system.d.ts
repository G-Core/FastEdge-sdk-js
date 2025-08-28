/**
 * Normalizes and resolves the path for Unix/Windows compatibility.
 * @param paths - The paths to normalize and resolve.
 * @returns The normalized and resolved path.
 */
declare const resolveOsPath: (...paths: string[]) => string;
/**
 * Replaces backslashes with forward slashes - Wizer requires Unix paths.
 * @param path - The path to convert.
 * @returns The Unix-compatible path.
 */
declare const useUnixPath: (path: string) => string;
/**
 * Resolves the path to a file within the NPX package.
 * @param filePath - The file path to resolve.
 * @returns The resolved NPX package path.
 */
declare const npxPackagePath: (filePath: string) => string;
/**
 * Checks if the given path is a directory.
 * @param path - The path to check.
 * @param withContent - Whether to check if the directory contains files.
 * @returns `true` if the path is a directory, otherwise `false`.
 */
declare function isDirectory(path: string, withContent?: boolean): Promise<boolean>;
/**
 * Creates the output directory recursively.
 * @param outputPath - The path to the output directory.
 */
declare function createOutputDirectory(outputPath: string): Promise<void>;
/**
 * Checks if the given path is a file.
 * @param filePath - The path to check.
 * @param allowNonexistent - Whether to allow nonexistent files.
 * @returns `true` if the path is a file, otherwise `false`.
 */
declare function isFile(filePath: string, allowNonexistent?: boolean): Promise<boolean>;
/**
 * Creates a temporary directory.
 * @returns The path to the temporary directory.
 */
declare function getTmpDir(): Promise<string>;
/**
 * Resolves the path to a temporary file.
 * @param filePath - The base path for the temporary file.
 * @returns The resolved path to the temporary file.
 */
declare function resolveTmpDir(filePath: string): string;
/**
 * Recursively retrieves files from a directory.
 * @param inputPath - The path to the directory.
 * @param opts - Options for filtering files.
 * @returns An array of file paths.
 */
declare function getFilesRecursively(inputPath: string, opts: {
    ignoreDirs?: string[];
    ignoreDotFiles?: boolean;
    ignoreWellKnown?: boolean;
}): string[];
export { createOutputDirectory, getFilesRecursively, getTmpDir, isDirectory, isFile, npxPackagePath, resolveOsPath, resolveTmpDir, useUnixPath, };
