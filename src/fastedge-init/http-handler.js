import { createConfigFile } from './create-config.js';

import { isFile } from '~utils/file-system.js';
import { colorLog, inputPrompt } from '~utils/prompts.js';

async function setupHttpApp() {
  const inputFileName = await inputPrompt('Enter the path to your entry file:', 'src/index.js');
  if (!(await isFile(inputFileName))) {
    colorLog('error', `Error: Input "${inputFileName}" is not a file`);
    process.exit(1);
  }
  const outputFileName = await inputPrompt(
    'Enter the path to your output file:',
    '.fastedge/dist/main.wasm',
  );
  if (outputFileName.slice(-5) !== '.wasm') {
    colorLog('error', `Error: Output ${outputFileName} must be a .wasm file path`);
    process.exit(1);
  }

  await createConfigFile('http', {
    input: inputFileName,
    output: outputFileName,
  });
}

export { setupHttpApp };
