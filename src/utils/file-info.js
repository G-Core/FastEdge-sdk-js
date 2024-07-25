import crypto from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Creates a file info object with the size and hash of the file.
 * @param {string} assetKey
 * @param {string} publicDir
 * @param {string} file
 * @returns {import('~static-server/types/assets/static-asset.js').FileInfo}
 */
function createFileInfo(assetKey, publicDir, file) {
  const stats = statSync(file);
  const lastModifiedTime = Math.floor(stats.mtime.getTime() / 1000);

  const fileBuffer = readFileSync(file);
  const size = fileBuffer.length;
  const hash = crypto.createHash('sha256');

  hash.update(fileBuffer);

  const assetPath = `./${path.join(publicDir, assetKey)}`;

  return {
    size,
    hash: hash.digest('hex'),
    lastModifiedTime,
    assetPath,
  };
}

export { createFileInfo };
