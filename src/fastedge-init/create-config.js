import { writeFile } from 'node:fs/promises';

import { CONFIG_FILE_PATH, PROJECT_DIRECTORY } from '~constants/index.js';
import { createOutputDirectory } from '~utils/file-system.js';

/**
 * @typedef {'build'|'server'} ConfigObjType
 */

/**
 * @typedef {'http'|'static'|'next'} ConfigType
 */

/**
 * @typedef {Object<ConfigType, Object>} ConfigTypeObject
 * @property {Object} http
 * @property {Object} next
 * @property {Object} static
 */

/**
 * @typedef {Object<ConfigObjType, ConfigTypeObject>} DefaultConfig
 */

/** @type {DefaultConfig} */
const defaultConfig = {
  build: {
    http: {},
    next: {},
    static: {
      input: '.fastedge/static-index.js',
      ignoreDotFiles: true,
      ignoreDirs: ['./node_modules'],
      ignoreWellKnown: false,
    },
  },
  server: {
    http: {},
    next: {},
    static: {
      extendedCache: [],
      publicDirPrefix: '',
      compression: [], // Not implemented - seems excessive for inline-wasm sizes ['br', 'gzip']
      notFoundPage: '/404.html',
      autoExt: [], // Never used before
      autoIndex: ['index.html', 'index.htm'],
    },
  },
};

/**
 * @param {ConfigObjType} configObjType
 * @param {ConfigType} type
 * @param {Object} config
 * @returns {string}
 */
function mergeWithDefaultConfig(configObjType, type, config) {
  return JSON.stringify(
    {
      type,
      ...defaultConfig[configObjType][type],
      ...config,
    },
    null,
    2,
  );
}

/**
 *
 * @param {ConfigType} type
 * @param {Object} buildConfig
 */
async function createConfigFile(type, buildConfig, serverConfig) {
  const buildConfigStr = mergeWithDefaultConfig('build', type, buildConfig);
  const serverConfigStr = mergeWithDefaultConfig('server', type, serverConfig);

  await createOutputDirectory(CONFIG_FILE_PATH);

  const fileContents = [
    `const config = ${buildConfigStr};`,
    '',
    `const serverConfig = ${serverConfigStr}`,
    '',
    'export { config, serverConfig };',
    '',
  ].join('\n');

  await writeFile(CONFIG_FILE_PATH, fileContents, 'utf-8');
}

/**
 * Creates basic package.json & jsconfig.json files for the ./fastedge folder
 * This ensures when building FastEdge it is using ES6 modules
 * i.e. end-user is building a project still based on ES5 / CommonJS
 */
async function createProjectFiles() {
  await createOutputDirectory(PROJECT_DIRECTORY);

  const packageJsonContents = [
    '{',
    '  "name": "fastedge-build",',
    '  "version": "1.0.0",',
    '  "description": "fastedge-build project folder uses ES6",',
    '  "type": "module"',
    '}',
  ].join('\n');

  await writeFile(`${PROJECT_DIRECTORY}/package.json`, packageJsonContents, 'utf-8');

  const jsConfigContents = ['{', '  "compilerOptions": {', '    "target": "ES6"', '  }', '}'].join(
    '\n',
  );

  await writeFile(`${PROJECT_DIRECTORY}/jsconfig.json`, jsConfigContents, 'utf-8');
}

export { createConfigFile, createProjectFiles };
