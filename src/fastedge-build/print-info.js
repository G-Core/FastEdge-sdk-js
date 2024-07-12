import { readFileSync } from 'node:fs';

import { npxPackagePath } from '~utils/file-system.js';
import { colorLog } from '~utils/prompts.js';

const USAGE_TEXT = `\nUsage: fastedge-build [options]

  Options:

  --help, -h      Print this help information
  --version, -v   Print the version number
  --input, -i     <input-file> Js filepath to build (e.g. ./src/index.js)
  --ouput, -o     <output-file> Output filepath for wasm (e.g. ./dist/main.wasm)
  --config, -c    <config-file> Path to a build config file (default: ./.fastedge/build-config.js)
`;

async function printVersion() {
  const { version } = JSON.parse(readFileSync(npxPackagePath('./package.json'), 'utf8'));
  colorLog('standard', `@gcoredev/fastedge-sdk-js: ${version}`);
}

function printHelp() {
  colorLog('standard', USAGE_TEXT);
}

export { printHelp, printVersion, USAGE_TEXT };
