import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolves the path to a file within the NPX package.
 * @param filePath - The file path to resolve.
 * @returns The resolved NPX package path.
 */
const npxPackagePath = (filePath: string): string => {
  const __dirname = path
    .dirname(fileURLToPath(import.meta.url))
    .replace(/[\\/]bin([\\/][^\\/]*)?$/u, '');

  try {
    return path.resolve(__dirname, filePath);
  } catch {
    throw new Error(`Failed to resolve the npxPackagePath: ${filePath}`);
  }
};

export { npxPackagePath };
