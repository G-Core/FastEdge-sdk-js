import { mkdir, mkdtemp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const npxPackagePath = (filePath) => {
  const __dirname = dirname(fileURLToPath(import.meta.url)).replace(/\/bin([^/]*)$/u, '');
  try {
    return resolve(__dirname, filePath);
  } catch {
    return null;
  }
};

async function isDirectory(path, withContent = false) {
  try {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      if (withContent) {
        const files = await readdir(path);
        return files.length > 0;
      }
      return true;
    }
    return false;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function createOutputDirectory(path) {
  try {
    await mkdir(dirname(path), {
      recursive: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error: Failed to create the "output" (${path}) directory`, error.message);
    process.exit(1);
  }
}

async function isFile(path, allowNonexistent = false) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return allowNonexistent;
    }
    throw error;
  }
}

async function getTmpDir() {
  return mkdtemp(normalize(tmpdir() + sep));
}

function resolveTmpDir(filePath) {
  return resolve(filePath, 'temp.bundle.js');
}

export { createOutputDirectory, getTmpDir, isDirectory, isFile, npxPackagePath, resolveTmpDir };
