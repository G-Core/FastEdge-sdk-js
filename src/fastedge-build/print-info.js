import { readFileSync } from 'node:fs';

const USAGE_TEXT = `Usage: componentize [options] <input-file> <output-file>

Options:

  --help, -h      Print this message
  --version, -v   Print the version number
`;

async function printVersion() {
  const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
  // eslint-disable-next-line no-console
  console.log(`@gcoredev/fastedge-sdk-js: ${version}`);
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(USAGE_TEXT);
}

export { printHelp, printVersion, USAGE_TEXT };
