import { setupHttpApp } from './http-handler.ts';
import { setupStaticApp } from './static-site.ts';

import { CONFIG_FILE_PATH } from '~constants/index.ts';
import { isFile } from '~utils/file-system.ts';
import { colorLog, confirmPrompt, selectPrompt } from '~utils/prompts.ts';

/**
 * Initializes the FastEdge application based on user input.
 */
async function initializeFastEdgeApp(): Promise<void> {
  const alreadyHasConfigFile = await isFile(CONFIG_FILE_PATH);
  if (alreadyHasConfigFile) {
    colorLog('warning', `Warning: FastEdge config file '${CONFIG_FILE_PATH}' already exists`);
    const overwrite = await confirmPrompt(
      'Do you want to overwrite the existing config file?',
      false,
    );
    if (!overwrite) {
      process.exit(0);
    }
  }

  const initType = await selectPrompt<'http' | 'static'>(
    'What are you trying to build?',
    [
      { name: 'Http event-handler', value: 'http' },
      { name: 'Static website', value: 'static' },
    ],
    'Http event-handler',
  );

  switch (initType) {
    case 'http':
      await setupHttpApp();
      break;
    case 'static':
      await setupStaticApp();
      break;
    default:
      process.exit(1);
  }

  colorLog('success', 'FastEdge initialization completed successfully');
}

await initializeFastEdgeApp();
