import { componentize } from 'src/componentize';
import { validateFilePaths } from 'src/utils/input-path-verification';

import { printHelp, printVersion } from './print-info';

const args = process.argv.slice(2);
const flags = [];
let inputFileName = '';
let outputFileName = '';

if (args.length === 0) {
  // try build from config @ .fastedge
  // ELSE
  printHelp();
  process.exit(1);
}

for (const arg of args) {
  if (arg.startsWith('-')) {
    flags.push(arg);
  } else if (inputFileName === '') {
    inputFileName = arg;
  } else if (outputFileName === '') {
    outputFileName = arg;
  } else {
    // eslint-disable-next-line no-console
    console.log(`Unexpected argument ${arg}`);
    process.exit(1);
  }
}

if (flags.includes('--help') || flags.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (flags.includes('--version') || flags.includes('-v')) {
  printVersion();
  if (!inputFileName || !outputFileName) {
    process.exit(0);
  }
}

if (flags.includes('--config') || flags.includes('-c')) {
  if (!inputFileName || outputFileName) {
    printHelp();
    process.exit(1);
  }
  console.log('Farq: config file', inputFileName);
}

if (inputFileName && outputFileName) {
  validateFilePaths(inputFileName, outputFileName);
} else {
  printHelp();
  process.exit(1);
}

if (process.env.NODE_ENV !== 'test') {
  await componentize(inputFileName, outputFileName);
}
