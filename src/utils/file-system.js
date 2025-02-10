import { readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { colorLog } from './prompts.js';

/**
 *
 * Normalizes and resolves the path for unix/windows compatibility
 * @param {Array<string>} paths
 * @returns {string} path
 */
const resolveOsPath = (...paths) => path.normalize(resolve(...paths));

/**
 *
 * Replaces backslashes with forward slashes - wizer requires unix paths
 * @param {string} path
 * @returns {string} path
 */
const useUnixPath = (path) => path.replace(/\\/gu, '/');

/**
 *
 * @param {string} filePath
 * @returns {string} npxPackagePath
 */
const npxPackagePath = (filePath) => {
  const __dirname = path
    .dirname(fileURLToPath(import.meta.url))
    .replace(/[\\/]bin([\\/][^\\/]*)?$/u, '');

  try {
    return path.resolve(__dirname, filePath);
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

async function createOutputDirectory(outputPath) {
  try {
    await mkdir(path.dirname(outputPath), {
      recursive: true,
    });
  } catch (error) {
    colorLog(
      'error',
      `Error: Failed to create the "output" (${outputPath}) directory`,
      error.message,
    );
    process.exit(1);
  }
}

async function isFile(filePath, allowNonexistent = false) {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return allowNonexistent;
    }
    throw error;
  }
}

async function getTmpDir() {
  return mkdtemp(path.normalize(tmpdir() + path.sep));
}

function resolveTmpDir(filePath) {
  return path.resolve(filePath, 'temp.bundle.js');
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

      const res = path.resolve(dir, name);
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
  resolveOsPath,
  resolveTmpDir,
  useUnixPath,
};
