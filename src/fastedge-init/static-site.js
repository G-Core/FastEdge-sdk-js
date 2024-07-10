import { writeFile } from 'node:fs/promises';

import { createOutputDirectory, isDirectory } from 'src/utils/file-system';
import { colorLog, inputPrompt } from 'src/utils/prompts';

import { createConfigFile } from './create-config';

const createInputFile = async (inputFileName) => {
  const fileContents = [
    '/// <reference types="@gcoredev/fastedge-sdk-js" />',
    'import { getServer } from "./build/static-server.js";',
    'const staticServer = getServer();',
    '',
    'async function handleRequest(event) {',
    '  const response = await staticServer.serveRequest(event.request);',
    '  if (response != null) {',
    '    return response;',
    '  }',
    '',
    '  return new Response("Not found", { status: 404 });',
    '}',
    '',
    'addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));',
  ].join('\n');
  await createOutputDirectory(inputFileName);
  await writeFile(inputFileName, fileContents, 'utf-8');
};

async function setupStaticApp() {
  const inputFileName = '.fastedge/static-index.js';
  await createInputFile(inputFileName);
  const outputFileName = await inputPrompt(
    'Enter the path to your output file:',
    '.fastedge/dist/main.wasm',
  );
  if (outputFileName.slice(-5) !== '.wasm') {
    colorLog('red', `Error: Output ${outputFileName} must be a .wasm file path`);
    process.exit(1);
  }

  // todo: farq: change this to ./build/public (./docs/dist is just for testing..)
  const publicDirectory = await inputPrompt(
    'Enter the path to your public directory:',
    './docs/dist',
  );

  const directoryExists = await isDirectory(publicDirectory, true);
  if (!directoryExists) {
    colorLog('red', `Error: Public directory "${publicDirectory}" is not a directory`);
    process.exit(1);
  }

  await createConfigFile('static', {
    input: inputFileName,
    output: outputFileName,
    publicDir: publicDirectory,
  });
}

export { setupStaticApp };
