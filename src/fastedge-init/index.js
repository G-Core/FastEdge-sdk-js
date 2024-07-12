import { setupHttpApp } from './http-handler.js';
import { setupNextApp } from './next-app.js';
import { setupStaticApp } from './static-site.js';

import { CONFIG_FILE_PATH } from '~constants/index.js';
import { isFile } from '~utils/file-system.js';
import { colorLog, confirmPrompt, selectPrompt } from '~utils/prompts.js';

const alreadyHasConfigFile = await isFile(CONFIG_FILE_PATH);
if (alreadyHasConfigFile) {
  colorLog('error', `Error: FastEdge config file '${CONFIG_FILE_PATH}' already exists`);
  const overwrite = await confirmPrompt(
    'Do you want to overwrite the existing config file?',
    false,
  );
  if (!overwrite) {
    process.exit(0);
  }
}

const isNextDirectoryPresent = await isFile('./.next/build-manifest.json');

if (isNextDirectoryPresent) {
  const nextJsApp = await confirmPrompt('\nAre you initializing a Next.js app?', true);
  if (nextJsApp) {
    setupNextApp();
    process.exit(0);
  }
}

const initType = await selectPrompt(
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
