import { readFileSync } from 'node:fs';

import { colorLog } from '~utils/color-log.ts';
import { npxPackagePath } from '~utils/npx-path.ts';

const USAGE_TEXT = `\nUsage: fastedge-assets [options]

  Options:

  --help, -h      Print this help information
  --version, -v   Print the version number
  --input, -i     <input-path> Filepath to the public asset folder (e.g. ./public)
  --output, -o    <output-file> Output filepath for static-asset-manifest (e.g. ./.fastedge/build/static-asset-manifest.js)
  --config, -c    <config-file> Path to an asset build config file (default: ./.fastedge/asset-config.js)
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
