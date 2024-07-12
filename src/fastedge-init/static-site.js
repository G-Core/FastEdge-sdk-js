import { writeFile } from 'node:fs/promises';

import { createConfigFile } from './create-config.js';

import { createOutputDirectory, isDirectory } from '~utils/file-system.js';
import { colorLog, inputPrompt } from '~utils/prompts.js';

const createInputFile = async (inputFileName) => {
  const fileContents = [
    '/*',
    ' * Generated by @gcoredev/FastEdge-sdk-js fastedge-init',
    ' */',
    '',
    'import { getStaticServer, createStaticAssetsCache } from "@gcoredev/fastedge-sdk-js";',
    'import { serverConfig, staticAssetManifest } from "./build/static-server-manifest.js";',
    '',
    'const staticAssets = createStaticAssetsCache(staticAssetManifest);',
    '',
    'const staticServer = getStaticServer(serverConfig, staticAssets);',
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
    '',
  ].join('\n');
  await createOutputDirectory(inputFileName);
  await writeFile(inputFileName, fileContents, 'utf-8');
};

async function setupStaticApp() {
  const inputFileName = '.fastedge/static-index.js';
  await createInputFile(inputFileName);
  const outputFileName = await inputPrompt(
    'Enter the path to your output file:',
    '.fastedge/dist/fastedge.wasm',
  );
  if (outputFileName.slice(-5) !== '.wasm') {
    colorLog('error', `Error: Output ${outputFileName} must be a .wasm file path`);
    process.exit(1);
  }

  const publicDirectory = await inputPrompt(
    'Enter the path to your public directory:',
    './build/public',
  );

  const directoryExists = await isDirectory(publicDirectory, true);
  if (!directoryExists) {
    colorLog('error', `Error: Public directory "${publicDirectory}" is not a directory`);
    process.exit(1);
  }

  await createConfigFile('static', {
    input: inputFileName,
    output: outputFileName,
    publicDir: publicDirectory,
  });
}

export { setupStaticApp };
