import { pathToFileURL } from 'node:url';

import { createStaticManifest } from './build-manifest/create-static-manifest.js';
import { buildWasm } from './build-wasm.js';

import { normalizeBuildConfig } from '~utils/config-helpers.js';
import { isFile, resolveOsPath } from '~utils/file-system.js';
import { colorLog } from '~utils/prompts.js';

async function buildFromConfig(config) {
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
      console.log('Farq: next build - Not yet implemented');
      break;
    }
    default: {
      colorLog('error', 'Error: Invalid config type. Must be one of: static, http, next.');
      break;
    }
  }
}

async function loadConfig(configPath) {
  try {
    const configFileExists = await isFile(configPath);
    if (configFileExists) {
      const configUrlPath = pathToFileURL(configPath).href;
      const { config } = await import(/* webpackChunkName: "config" */ configUrlPath);
      return normalizeBuildConfig(config);
    }
    colorLog('error', `Error: Config file not found at ${configPath}. Skipping build.`);
  } catch (error) {
    colorLog('error', 'Error loading config:', error);
    throw error;
  }
}

async function buildFromConfigFiles(configFilePaths = []) {
  for (const configFilePath of configFilePaths) {
    const configPath = resolveOsPath(configFilePath);
    // Await in loop is correct, it must run sequentially - it overwrites files within each build cycle
    // eslint-disable-next-line no-await-in-loop
    await buildFromConfig(await loadConfig(configPath));
  }
  process.exit(0);
}

export { buildFromConfigFiles };
