import arg from 'arg';

import { buildFromConfigFiles, buildWasm } from './config-build.ts';
import { printHelp, printVersion } from './print-info.ts';

import { CONFIG_FILE_PATH } from '~constants/index.ts';
import { colorLog } from '~utils/color-log.ts';

/**
 * Represents the parsed arguments from the CLI.
 */
interface ParsedArgs {
  _: string[];
  '--version'?: boolean;
  '--help'?: boolean;
  '--input'?: string;
  '--output'?: string;
  '--config'?: string[];
}

let inputFileName = '';
let outputFileName = '';
let configFiles: string[] = [];
let args: ParsedArgs;

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
  ) as ParsedArgs;
} catch (error: unknown) {
  const errorMessage = (error as Error).toString();
  if (errorMessage.includes('option requires argument: -c')) {
    // Set default config file - buildFromConfigFiles() will do error handling
    // This happens when running: `fastedge-build -c` without specifying a filepath
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
  process.exit(hasValidInput ? 0 : 1);
}

if (args['--version']) {
  await printVersion();
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
    entryPoint: inputFileName,
    wasmOutput: outputFileName,
  });
  colorLog('success', `Build success!!`);
  colorLog('info', `"${inputFileName}" -> "${outputFileName}"`);
  process.exit(0);
}

if (configFiles.length > 0 && configFiles[0].length > 0) {
  await buildFromConfigFiles(configFiles);
  process.exit(0);
}

printHelp();
process.exit(1);
