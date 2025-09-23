import { readFileSync } from 'node:fs';

import { colorLog } from '~utils/color-log.ts';
import { npxPackagePath } from '~utils/npx-path.ts';

const USAGE_TEXT = `\nUsage: fastedge-build [options]

  Options:

  --help, -h      Print this help information
  --version, -v   Print the version number
  --input, -i     <input-file> Js filepath to build (e.g. ./src/index.js)
  --output, -o    <output-file> Output filepath for wasm (e.g. ./dist/main.wasm)
  --tsconfig, -t  <tsconfig-file> Path to a TypeScript config file (default: ./tsconfig.json)
  --config, -c    <config-file> Path to a build config file (default: ./.fastedge/build-config.js)
`;

/**
 * Prints the version of the FastEdge SDK.
 */
async function printVersion(): Promise<void> {
  const packageJsonPath = npxPackagePath('./package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const { version }: { version: string } = JSON.parse(packageJsonContent);
  colorLog('standard', `@gcoredev/fastedge-sdk-js: ${version}`);
}

/**
 * Prints the usage help text.
 */
function printHelp(): void {
  colorLog('standard', USAGE_TEXT);
}

export { printHelp, printVersion, USAGE_TEXT };
