import { pathToFileURL } from 'node:url';

import { createStaticManifest } from './build-manifest/create-static-manifest.ts';
import { buildWasm } from './build-wasm.ts';

import { normalizeBuildConfig } from '~utils/config-helpers.ts';
import { isFile, resolveOsPath } from '~utils/file-system.ts';
import { colorLog } from '~utils/prompts.ts';

import type { ContentTypeDefinition } from '~utils/content-types.ts';

/**
 * Represents the configuration object for building.
 */
interface BuildConfig {
  type: 'static' | 'http' | 'next';
  input: string;
  output: string;
  publicDir: string;
  ignoreDirs?: string[];
  ignoreDotFiles?: boolean;
  ignoreWellKnown?: boolean;
  contentTypes?: Array<ContentTypeDefinition>;
}

/**
 * Builds the project based on the provided configuration.
 * @param config - The configuration object.
 */
async function buildFromConfig(config: BuildConfig | null): Promise<void> {
  if (!config) return;

  switch (config.type) {
    case 'static': {
      await createStaticManifest(config);
      await buildWasm(config);
      colorLog('success', `Success: Built ${config.output}`);
      break;
    }
    case 'http': {
      await buildWasm(config);
      colorLog('success', `Success: Built ${config.output}`);
      break;
    }
    case 'next': {
      colorLog('info', 'Farq: next build - Not yet implemented');
      break;
    }
    default: {
      colorLog('error', 'Error: Invalid config type. Must be one of: static, http, next.');
      break;
    }
  }
}

/**
 * Loads the configuration file from the given path.
 * @param configPath - The path to the configuration file.
 * @returns The normalized configuration object.
 */
async function loadConfig(configPath: string): Promise<BuildConfig | null> {
  try {
    const configFileExists = await isFile(configPath);
    if (configFileExists) {
      const configUrlPath = pathToFileURL(configPath).href;
      const { config } = await import(/* webpackChunkName: "config" */ configUrlPath);
      return normalizeBuildConfig(config) as BuildConfig;
    }
    colorLog('error', `Error: Config file not found at ${configPath}. Skipping build.`);
    return null;
  } catch (error) {
    colorLog('error', 'Error loading config:', error);
    throw error;
  }
}

/**
 * Builds the project from multiple configuration files.
 * @param configFilePaths - The paths to the configuration files.
 */
async function buildFromConfigFiles(configFilePaths: string[] = []): Promise<void> {
  for (const configFilePath of configFilePaths) {
    const configPath = resolveOsPath(configFilePath);
    // Await in loop is correct, it must run sequentially - it overwrites files within each build cycle
    await buildFromConfig(await loadConfig(configPath));
  }
  process.exit(0);
}

export { buildFromConfigFiles };
export type { BuildConfig };
