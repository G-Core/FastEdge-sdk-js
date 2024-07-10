import { isFile, npxPackagePath } from 'src/utils/file-system';
import { colorLog } from 'src/utils/prompts';

import { buildWasm } from './build-wasm';

async function buildFromConfig(config) {
  if (!config) return;
  console.log('Farq: config', config);
  switch (config.type) {
    case 'static': {
      console.log('Farq: static build');
      break;
    }
    case 'http': {
      await buildWasm(config);
      colorLog('green', `Success: Built ${config.output}`);
      break;
    }
    case 'next': {
      console.log('Farq: next build - Not yet implemented');
      break;
    }
    default: {
      colorLog('red', 'Error: Invalid config type. Must be one of: static, http, next.');
      break;
    }
  }
}

async function loadConfig(configPath) {
  try {
    const configFileExists = await isFile(configPath);
    if (configFileExists) {
      const { config } = await import(/* webpackChunkName: "config" */ configPath);
      return config;
    }
    colorLog('red', `Error: Config file not found at ${configPath}. Skipping build.`);
  } catch (error) {
    colorLog('red', 'Error loading config:', error);
    throw error;
  }
}

async function buildFromConfigFiles(configFilePaths = []) {
  for (const configFilePath of configFilePaths) {
    const configPath = npxPackagePath(configFilePath);
    // Await in loop is correct, it must run sequentially - it overwrites files within each build cycle
    // eslint-disable-next-line no-await-in-loop
    await buildFromConfig(await loadConfig(configPath));
  }
  process.exit(0);
}

export { buildFromConfigFiles };
