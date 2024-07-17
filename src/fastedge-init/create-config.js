import { writeFile } from 'node:fs/promises';

import { CONFIG_FILE_PATH } from '~constants/index.js';
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
      // todo: Farq: clean this up.. what do we actually use and need here??
      staticItems: [], // Do not know what this is..

      publicDirPrefix: '',
      compression: ['br', 'gzip'], // not implemented yet
      notFoundPage: '/404.html',
      autoExt: [], // never used before
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

export { createConfigFile };
