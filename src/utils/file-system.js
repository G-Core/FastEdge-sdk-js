import { readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { dirname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorLog } from './prompts.js';

/**
 *
 * @param {string} filePath
 * @returns {string} npxPackagePath
 */
const npxPackagePath = (filePath) => {
  const __dirname = dirname(fileURLToPath(import.meta.url)).replace(/\/bin([^/]*)$/u, '');
  try {
    return resolve(__dirname, filePath);
  } catch {
    throw new Error(`Failed to resolve the npxPackagePath: ${filePath}`);
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
    colorLog('error', `Error: Failed to create the "output" (${path}) directory`, error.message);
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

/**
 *
 * @param {string} inputPath
 * @param {{
 *  ignoreDirs: Array<string>
 *  ignoreDotFiles: boolean
 *  ignoreWellKnown: boolean
 * }} opts
 * @returns {Array<string>} files
 */
function getFilesRecursively(inputPath, opts) {
  const { ignoreDirs = [], ignoreDotFiles = true, ignoreWellKnown = false } = opts;
  const files = [];
  const readDir = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const { name } = entry;
      const fullpath = path.resolve(dir, name);
      const relative = `/${path.relative(inputPath, fullpath)}`;
      // Remove ignoreDirs file trees
      if (ignoreDirs.includes(relative)) continue;
      // Remove .well-known file trees
      const removeWellKnown = ignoreWellKnown && name === '.well-known';
      if (removeWellKnown) continue;
      // Remove ignoreDotFiles file trees (except .well-known)
      if (ignoreDotFiles && name.startsWith('.') && name !== '.well-known') continue;

      const res = resolve(dir, name);
      if (entry.isDirectory()) {
        readDir(res);
      } else {
        files.push(res);
      }
    }
  };
  readDir(inputPath);
  return files;
}

export {
  createOutputDirectory,
  getFilesRecursively,
  getTmpDir,
  isDirectory,
  isFile,
  npxPackagePath,
  resolveTmpDir,
};
