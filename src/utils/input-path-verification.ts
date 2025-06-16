import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { createOutputDirectory, isFile } from '~utils/file-system.ts';
import { colorLog } from '~utils/prompts.ts';

/**
 * Checks if the given JavaScript file contains syntax errors.
 * @param jsInput - The path to the JavaScript file.
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsJavascriptSyntaxErrors(jsInput: string): boolean {
  const nodeProcess: SpawnSyncReturns<string> = spawnSync(
    `"${process.execPath}"`,
    ['--check', jsInput],
    {
      stdio: [null, null, null],
      shell: true,
      encoding: 'utf-8',
    },
  );

  if (nodeProcess.status === 0) {
    return false;
  }

  colorLog('warning', `${nodeProcess.stderr}`);
  colorLog('error', `SyntaxError: JavaScript code`);
  colorLog('error', `Error: "${jsInput}" contains JS errors`);
  return true;
}

/**
 * Checks if TypeScript is installed.
 * @returns `true` if TypeScript is installed, otherwise `false`.
 */
function isTypeScriptInstalled(): boolean {
  const result: SpawnSyncReturns<string> = spawnSync('npx', ['tsc', '--version'], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });

  if (result.status === 0) {
    return true;
  }

  colorLog('error', 'TypeScript is not installed.');
  colorLog('error', 'Please run "npm install typescript"');
  return false;
}

/**
 * Checks if the given TypeScript file contains syntax errors.
 * @param tsInput - The path to the TypeScript file.
 * @param tsconfigPath - The path to the TypeScript configuration file (optional).
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsTypeScriptSyntaxErrors(tsInput: string, tsconfigPath?: string): boolean {
  if (isTypeScriptInstalled()) {
    const includeFastEdgeTypes =
      process.env.NODE_ENV === 'test'
        ? []
        : ['--types', './node_modules/@gcoredev/fastedge-sdk-js'];

    const defaultTscBuildFlags = [
      '--noEmit',
      '--skipLibCheck',
      '--strict',
      '--target',
      'esnext',
      '--moduleResolution',
      'node',
      ...includeFastEdgeTypes,
      tsInput,
    ];

    const tscBuildFlags = tsconfigPath ? ['--project', tsconfigPath] : defaultTscBuildFlags;

    const nodeProcess: SpawnSyncReturns<string> = spawnSync('npx', ['tsc', ...tscBuildFlags], {
      stdio: [null, null, null],
      shell: true,
      encoding: 'utf-8',
    });

    if (nodeProcess.status === 0) {
      return false;
    }

    colorLog('warning', `${nodeProcess.stdout}`);
    colorLog('error', `SyntaxError: TypeScript code`);
    colorLog('error', `Error: "${tsInput}" contains TypeScript errors`);
    return true;
  }

  return true; // TypeScript is not installed
}

/**
 * Checks if the given file contains syntax errors.
 * @param jsInput - The path to the file.
 * @param tsconfigPath - The path to the TypeScript configuration file (optional).
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsSyntaxErrors(jsInput: string, tsconfigPath?: string): boolean {
  if (jsInput.endsWith('.js')) {
    return containsJavascriptSyntaxErrors(jsInput);
  }

  if (jsInput.endsWith('.ts')) {
    return containsTypeScriptSyntaxErrors(jsInput, tsconfigPath);
  }

  colorLog('error', `Error: "${jsInput}" is not a valid file type - must be ".js" or ".ts"`);
  return true;
}

/**
 * Validates that the given file exists.
 * @param filePath - The path to the file.
 * @throws An error if the file does not exist.
 */
async function validateFileExists(filePath: string): Promise<void> {
  if (!(await isFile(filePath))) {
    colorLog('error', `Error: "${filePath}" is not a file`);
    process.exit(1);
  }
}

/**
 * Validates the input and output file paths.
 * @param input - The path to the input file.
 * @param output - The path to the output file.
 * @throws An error if the paths are invalid.
 */
async function validateFilePaths(input: string, output: string): Promise<void> {
  if (!(await isFile(input))) {
    colorLog('error', `Error: Input "${input}" is not a file`);
    process.exit(1);
  }

  if (!output.endsWith('.wasm')) {
    colorLog('error', `Error: Output "${output}" must be a .wasm file path`);
    process.exit(1);
  }

  if (!(await isFile(output))) {
    await createOutputDirectory(output);

    if (!(await isFile(output, /* AllowNonexistent */ true))) {
      colorLog('error', `Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }

  if (containsSyntaxErrors(input)) {
    process.exit(1);
  }
}

export { containsSyntaxErrors, validateFileExists, validateFilePaths };
