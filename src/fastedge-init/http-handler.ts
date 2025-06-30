import { createConfigFile } from './create-config.ts';

import { isFile } from '~utils/file-system.ts';
import { colorLog, inputPrompt } from '~utils/prompts.ts';

/**
 * Sets up an HTTP application by prompting the user for input and output file paths.
 * Validates the provided paths and creates a configuration file.
 */
async function setupHttpApp(): Promise<void> {
  const inputFileName = await inputPrompt('Enter the path to your entry file:', 'src/index.js');
  if (!(await isFile(inputFileName))) {
    colorLog('error', `Error: Input "${inputFileName}" is not a file`);
    process.exit(1);
  }

  const outputFileName = await inputPrompt(
    'Enter the path to your output file:',
    '.fastedge/dist/main.wasm',
  );
  if (!outputFileName.endsWith('.wasm')) {
    colorLog('error', `Error: Output "${outputFileName}" must be a .wasm file path`);
    process.exit(1);
  }

  await createConfigFile(
    'http',
    {
      input: inputFileName,
      output: outputFileName,
    },
    {},
  );
}

export { setupHttpApp };
