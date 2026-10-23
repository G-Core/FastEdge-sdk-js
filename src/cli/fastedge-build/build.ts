import arg from 'arg';

import { buildFromConfigFiles, buildFromConfigFileTo, buildWasm } from './config-build.ts';
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
  '--tsconfig'?: string;
  '--config'?: string[];
  '--component'?: string[];
}

let inputFileName = '';
let outputFileName = '';
let tsConfigPath = '';
let configFiles: string[] = [];
const components: Record<string, string> = {};
let args: ParsedArgs;

// `-c` without a path uses the default config file, also when other options follow it
const argv = process.argv
  .slice(2)
  .flatMap((value, index, all) =>
    value === '-c' && (all[index + 1] === undefined || all[index + 1].startsWith('-'))
      ? [value, CONFIG_FILE_PATH]
      : [value],
  );

try {
  args = arg(
    {
      // Types
      '--version': Boolean,
      '--help': Boolean,
      '--input': String,
      '--output': String,
      '--tsconfig': String,
      '--config': [String],
      '--component': [String],

      // Aliases
      '-v': '--version',
      '-h': '--help',
      '-i': '--input',
      '-o': '--output',
      '-t': '--tsconfig',
      '-c': '--config',
    },
    {
      argv,
      permissive: true,
    },
  ) as ParsedArgs;
} catch {
  printHelp();
  process.exit(0);
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

if (args['--tsconfig']) {
  tsConfigPath = args['--tsconfig'];
}

for (const spec of args['--component'] ?? []) {
  const separator = spec.indexOf('=');
  if (separator < 1) {
    colorLog('error', `Error: --component expects <interface>=<path>, got "${spec}"`);
    process.exit(1);
  }
  components[spec.slice(0, separator)] = spec.slice(separator + 1);
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
    tsConfigPath,
    components,
  });
  colorLog('success', `Build success!!`);
  colorLog('info', `"${inputFileName}" -> "${outputFileName}"`);
  process.exit(0);
}

if (configFiles.length > 0 && configFiles[0].length > 0) {
  if (outputFileName) {
    if (configFiles.length > 1) {
      colorLog('error', 'Error: --output can only be used with a single --config');
      process.exit(1);
    }
    await buildFromConfigFileTo(configFiles[0], outputFileName);
  }
  await buildFromConfigFiles(configFiles);
  process.exit(0);
}

printHelp();
process.exit(1);
