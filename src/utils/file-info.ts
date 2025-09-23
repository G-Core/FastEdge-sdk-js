import crypto from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

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
function createFileInfo(assetKey: string, publicDir: string, file: string): FileInfo {
  const stats = statSync(file);
  const lastModifiedTime = Math.floor(stats.mtime.getTime() / 1000);

  const fileBuffer = readFileSync(file);
  const size = fileBuffer.length;
  const hash = crypto.createHash('sha256');

  hash.update(fileBuffer);

  const assetPath = `.${path.join(publicDir, assetKey)}`;

  return {
    size,
    hash: hash.digest('hex'),
    lastModifiedTime,
    assetPath,
  };
}

export { createFileInfo };
export type { FileInfo };
