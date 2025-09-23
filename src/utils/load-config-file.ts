import { pathToFileURL } from 'node:url';

import { colorLog } from '~utils/color-log.ts';
import { isFile } from '~utils/file-system.ts';

/**
 * Loads the configuration file from the given path.
 * @param configPath - The path to the configuration file.
 * @returns The normalized configuration object.
 */
async function loadConfig<T>(configPath: string): Promise<T | null> {
  try {
    const configFileExists = await isFile(configPath);
    if (configFileExists) {
      const configUrlPath = pathToFileURL(configPath).href;
      const { config } = await import(/* webpackChunkName: "config" */ configUrlPath);
      return config as T;
    }
    colorLog('error', `Error: Config file not found at ${configPath}. Skipping file.`);
    return null;
  } catch (error) {
    colorLog('error', 'Error loading config:', error);
    throw error;
  }
}

export { loadConfig };
