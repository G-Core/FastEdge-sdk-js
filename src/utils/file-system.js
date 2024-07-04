import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const npxPackagePath = (filePath) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  try {
    return resolve(__dirname, filePath);
  } catch {
    return null;
  }
};

async function getTmpDir() {
  return mkdtemp(normalize(tmpdir() + sep));
}

function resolveTmpDir(filePath) {
  return resolve(filePath, 'temp.bundle.js');
}

export { getTmpDir, npxPackagePath, resolveTmpDir };
