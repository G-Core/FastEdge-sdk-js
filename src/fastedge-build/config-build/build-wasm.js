import { componentize } from 'src/componentize';
import { validateFilePaths } from 'src/utils/input-path-verification';

async function buildWasm({ input, output }) {
  validateFilePaths(input, output);
  if (process.env.NODE_ENV !== 'test') {
    await componentize(input, output);
  }
}

export { buildWasm };
