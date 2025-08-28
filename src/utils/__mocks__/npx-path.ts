import path from 'node:path';

/**
 * Resolves the path to a file within the NPX package.
 * @param filePath - The file path to resolve.
 * @returns The resolved NPX package path.
 */
const npxPackagePath = (filePath: string): string => path.join('root_dir', filePath);

export { npxPackagePath };
