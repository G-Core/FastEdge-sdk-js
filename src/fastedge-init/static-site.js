import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createConfigFile } from './create-config.js';

import { normalizePath } from '~utils/config-helpers.js';
import { createOutputDirectory, isDirectory, isFile } from '~utils/file-system.js';
import { colorLog, confirmPrompt, inputPrompt } from '~utils/prompts.js';

const createInputFile = async (inputFileName) => {
  const fileContents = [
    '/*',
    ' * Generated by @gcoredev/FastEdge-sdk-js fastedge-init',
    ' */',
    '',
    'import { getStaticServer, createStaticAssetsCache } from "@gcoredev/fastedge-sdk-js";',
    'import { staticAssetManifest } from "./build/static-server-manifest.js";',
    'import { serverConfig } from "./build-config.js";',
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

  const publicDirectory = await inputPrompt('Enter the path to your public directory:', './build');

  const directoryExists = await isDirectory(publicDirectory, true);
  if (!directoryExists) {
    colorLog('error', `Error: Public directory "${publicDirectory}" is not a directory`);
    process.exit(1);
  }

  const isSpa = await confirmPrompt(
    'Is your site a single page application? ( e.g. React )',
    false,
  );
  let spaEntrypoint = null;
  if (isSpa) {
    const entrypoint = await inputPrompt('Enter the path to your SPA entrypoint:', './index.html');
    const spaEntrypointExists = await isFile(
      path.resolve(path.join(publicDirectory, './index.html')),
    );
    if (spaEntrypointExists) {
      spaEntrypoint = normalizePath(entrypoint);
    } else {
      colorLog(
        'warning',
        `Error: SPA entrypoint "${entrypoint}" does not exist in the public directory. Please check the path`,
      );
    }
  }

  await createConfigFile(
    'static',
    {
      input: inputFileName,
      output: outputFileName,
      publicDir: publicDirectory,
    },
    {
      spaEntrypoint,
    },
  );
}

export { setupStaticApp };
