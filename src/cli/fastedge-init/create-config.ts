import { writeFile } from 'node:fs/promises';

import { CONFIG_FILE_PATH, PROJECT_DIRECTORY } from '~constants/index.ts';
import { createOutputDirectory } from '~utils/file-system.ts';

/**
 * Represents the type of configuration object.
 */
type ConfigObjType = 'build' | 'server';

/**
 * Represents the type of configuration.
 */
type ConfigType = 'http' | 'static';

/**
 * Represents the configuration type object.
 */
interface ConfigTypeObject {
  http: Record<string, unknown>;
  static: {
    entryPoint?: string;
    ignoreDotFiles?: boolean;
    ignoreDirs?: string[];
    ignoreWellKnown?: boolean;
    extendedCache?: string[];
    publicDirPrefix?: string;
    compression?: string[];
    notFoundPage?: string;
    autoExt?: string[];
    autoIndex?: string[];
  };
}

/**
 * Represents the default configuration object.
 */
type DefaultConfig = Record<ConfigObjType, ConfigTypeObject>;

/** Default configuration object */
const defaultConfig: DefaultConfig = {
  build: {
    http: {},
    static: {
      entryPoint: '.fastedge/static-index.js',
      ignoreDotFiles: true,
      ignoreDirs: ['./node_modules'],
      ignoreWellKnown: false,
    },
  },
  server: {
    http: {},
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
 * Merges the provided configuration with the default configuration.
 * @param configObjType - The type of configuration object ('build' or 'server').
 * @param type - The type of configuration ('http', 'static', or 'next').
 * @param config - The custom configuration to merge.
 * @returns The merged configuration as a JSON string.
 */
function mergeWithDefaultConfig(
  configObjType: ConfigObjType,
  type: ConfigType,
  config: Record<string, unknown>,
): string {
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
 * Creates a configuration file.
 * @param type - The type of configuration ('http', 'static', or 'next').
 * @param buildConfig - The build configuration.
 * @param serverConfig - The server configuration.
 */
async function createConfigFile(
  type: ConfigType,
  buildConfig: Record<string, unknown>,
  serverConfig: Record<string, unknown>,
): Promise<void> {
  const buildConfigStr = mergeWithDefaultConfig('build', type, buildConfig);
  const serverConfigStr = mergeWithDefaultConfig('server', type, serverConfig);

  await createOutputDirectory(CONFIG_FILE_PATH);

  const fileContents = [
    `const config = ${buildConfigStr};`,
    '',
    `const serverConfig = ${serverConfigStr};`,
    '',
    'export { config, serverConfig };',
    '',
  ].join('\n');

  await writeFile(CONFIG_FILE_PATH, fileContents, 'utf-8');
}

/**
 * Creates basic `package.json` and `jsconfig.json` files for the FastEdge project directory.
 * Ensures the project uses ES6 modules.
 */
async function createProjectFiles(): Promise<void> {
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
