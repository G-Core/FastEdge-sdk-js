import { isFile } from '~src/utils/file-system';
import { colorLog, inputPrompt } from '~src/utils/prompts';

import { createConfigFile } from './create-config';

async function setupHttpApp() {
  // todo: farq: change this to src/index.js (dist/index.js is just for testing..)
  const inputFileName = await inputPrompt('Enter the path to your entry file:', 'dist/index.js');
  if (!(await isFile(inputFileName))) {
    colorLog('red', `Error: Input "${inputFileName}" is not a file`);
    process.exit(1);
  }
  const outputFileName = await inputPrompt(
    'Enter the path to your output file:',
    '.fastedge/dist/main.wasm',
  );
  if (outputFileName.slice(-5) !== '.wasm') {
    colorLog('red', `Error: Output ${outputFileName} must be a .wasm file path`);
    process.exit(1);
  }

  await createConfigFile('http', {
    input: inputFileName,
    output: outputFileName,
  });
}

export { setupHttpApp };
