import { CONFIG_FILE_PATH } from 'src/constants';
import { isFile } from 'src/utils/file-system';
import { colorLog, confirmPrompt, selectPrompt } from 'src/utils/prompts';

import { setupHttpApp } from './http-handler';
import { setupNextApp } from './next-app';
import { setupStaticApp } from './static-site';

const alreadyHasConfigFile = await isFile(CONFIG_FILE_PATH);
if (alreadyHasConfigFile) {
  colorLog('red', `Error: FastEdge config file '${CONFIG_FILE_PATH}' already exists`);
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
    setupHttpApp();
    break;
  case 'static':
    setupStaticApp();
    break;
  default:
    process.exit(1);
}
