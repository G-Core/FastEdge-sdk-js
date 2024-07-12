import { writeFile } from 'node:fs/promises';

import { CONFIG_FILE_PATH } from '~constants/index.js';
import { createOutputDirectory } from '~utils/file-system.js';

const buildTypeConfig = {
  http: {},
  next: {},
  static: {
    input: '.fastedge/static-index.js',
    ignoreDotFiles: true,
    ignoreDirs: ['./node_modules'],
    ignoreWellKnown: false,
  },
};

/**
 *
 * @param {'http'|'static'|'next'} type
 * @param {Object} providedConfig
 */
async function createConfigFile(type, providedConfig = {}) {
  const config = {
    type,
    ...buildTypeConfig[type],
    ...providedConfig,
  };

  await createOutputDirectory(CONFIG_FILE_PATH);

  const fileContents = `const config = ${JSON.stringify(config, null, 2)};\n\nexport { config };\n`;

  await writeFile(CONFIG_FILE_PATH, fileContents, 'utf-8');
}

export { createConfigFile };
