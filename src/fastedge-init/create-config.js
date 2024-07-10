import { writeFile } from 'node:fs/promises';

import { CONFIG_FILE_PATH } from 'src/constants';

import { createOutputDirectory } from 'src/utils/file-system';

const defaultConfig = {
  static: {
    input: '.fastedge/static-index.js',
    ignoreDotFiles: true,
    ignoreDirs: ['./node_modules'],
    ignoreWellKnown: false,
  },
};

/**
 *
 * @param {'http' | 'static' | 'next'} type
 * @param {Object} providedConfig
 */
async function createConfigFile(type, providedConfig = {}) {
  const config = {
    type,
    ...defaultConfig[type],
    ...providedConfig,
  };

  await createOutputDirectory(CONFIG_FILE_PATH);

  const fileContents = `const config = ${JSON.stringify(config, null, 2)};\n\nexport { config };\n`;

  await writeFile(CONFIG_FILE_PATH, fileContents, 'utf-8');
}

export { createConfigFile };
