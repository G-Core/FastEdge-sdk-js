import { componentize } from 'src/componentize/index.js';

import { validateFilePaths } from '~utils/input-path-verification.js';

async function buildWasm({ input, output }) {
  validateFilePaths(input, output);
  if (process.env.NODE_ENV !== 'test') {
    await componentize(input, output);
  }
}

export { buildWasm };
