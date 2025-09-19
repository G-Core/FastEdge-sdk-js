import { Dirent, readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { colorLog } from '~utils/color-log.ts';

/**
 * Normalizes and resolves the path for Unix/Windows compatibility.
 * @param paths - The paths to normalize and resolve.
 * @returns The normalized and resolved path.
 */
const resolveOsPath = (...paths: string[]): string => path.normalize(path.resolve(...paths));

/**
 * Replaces backslashes with forward slashes - Wizer requires Unix paths.
 * @param path - The path to convert.
 * @returns The Unix-compatible path.
 */
const useUnixPath = (path: string): string => path.replace(/\\/gu, '/');

/**
 * Checks if the given path is a directory.
 * @param path - The path to check.
 * @param withContent - Whether to check if the directory contains files.
 * @returns `true` if the path is a directory, otherwise `false`.
 */
async function isDirectory(path: string, withContent: boolean = false): Promise<boolean> {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Creates the output directory recursively.
 * @param outputPath - The path to the output directory.
 */
async function createOutputDirectory(outputPath: string): Promise<void> {
  try {
    await mkdir(path.dirname(outputPath), {
      recursive: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    colorLog(
      'error',
      `Error: Failed to create the "output" (${outputPath}) directory`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * Checks if the given path is a file.
 * @param filePath - The path to check.
 * @param allowNonexistent - Whether to allow nonexistent files.
 * @returns `true` if the path is a file, otherwise `false`.
 */
async function isFile(filePath: string, allowNonexistent: boolean = false): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return allowNonexistent;
    }
    throw error;
  }
}

/**
 * Creates a temporary directory.
 * @returns The path to the temporary directory.
 */
async function getTmpDir(): Promise<string> {
  return mkdtemp(path.normalize(tmpdir() + path.sep));
}

/**
 * Resolves the path to a temporary file.
 * @param filePath - The base path for the temporary file.
 * @returns The resolved path to the temporary file.
 */
function resolveTmpDir(filePath: string): string {
  return path.resolve(filePath, 'temp.bundle.js');
}

/**
 * Recursively retrieves files from a directory.
 * @param inputPath - The path to the directory.
 * @param opts - Options for filtering files.
 * @returns An array of file paths.
 */
function getFilesRecursively(
  inputPath: string,
  opts: {
    ignoreDirs?: string[];
    ignoreDotFiles?: boolean;
    ignoreWellKnown?: boolean;
  },
): string[] {
  const { ignoreDirs = [], ignoreDotFiles = true, ignoreWellKnown = false } = opts;
  const files: string[] = [];

  const readDir = (dir: string): void => {
    const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const { name } = entry;
      const fullpath = path.resolve(dir, name);
      const relative = `/${path.relative(inputPath, fullpath)}`;

      // Remove ignoreDirs file trees
      if (ignoreDirs.includes(relative) || ignoreDirs.includes(fullpath)) continue;

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
  resolveOsPath,
  resolveTmpDir,
  useUnixPath,
};
