import arg from 'arg';

import { CONFIG_FILE_PATH } from 'src/constants';
import { buildWasm } from 'src/fastedge-build/config-build/build-wasm';
import { colorLog } from 'src/utils/prompts';

import { buildFromConfigFiles } from './config-build';
import { printHelp, printVersion } from './print-info';

let inputFileName = '';
let outputFileName = '';
let configFiles = [];
let args;

try {
  args = arg(
    {
      // Types
      '--version': Boolean,
      '--help': Boolean,
      '--input': String,
      '--output': String,
      '--config': [String],

      // Aliases
      '-v': '--version',
      '-h': '--help',
      '-i': '--input',
      '-o': '--output',
      '-c': '--config',
    },
    {
      permissive: true,
    },
  );
} catch (error) {
  if (error.toString().includes('option requires argument: -c')) {
    // Set default config file - buildFromConfigFiles() will do error handling
    // This is happens running: `fastedge-build -c` without specifying a filepath
    args = { _: [], '--config': [CONFIG_FILE_PATH] };
  } else {
    printHelp();
    process.exit(0);
  }
}

const hasFileInputsOnly =
  (args._.length === 1 || args._.length === 2) && Object.keys(args).length === 1;

const hasOptionsOnly = Object.keys(args).length > 1 && args._.length === 0;
const hasValidInput = hasFileInputsOnly || hasOptionsOnly;

if (args['--help'] || !hasValidInput) {
  printHelp();
  process.exit(0);
}

if (args['--version']) {
  printVersion();
  process.exit(0);
}

if (args['--input']) {
  inputFileName = args['--input'];
}

if (args['--output']) {
  outputFileName = args['--output'];
}

if (args._.length === 2) {
  [inputFileName, outputFileName] = args._;
}

if (args['--config']) {
  configFiles = args['--config'];
}
if (args._.length === 1) {
  configFiles = args._;
}
if (inputFileName && outputFileName) {
  await buildWasm({
    input: inputFileName,
    output: outputFileName,
  });
  colorLog('green', `Build success!!`);
  colorLog('magenta', `"${inputFileName}" -> "${outputFileName}"`);
  process.exit(0);
}

if (configFiles.length > 0) {
  await buildFromConfigFiles(configFiles);
  process.exit(0);
}

printHelp();
process.exit(1);
