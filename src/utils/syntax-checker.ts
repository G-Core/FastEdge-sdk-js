import { spawnSync, SpawnSyncReturns } from 'node:child_process';

import { colorLog } from '~utils/color-log.ts';

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
  colorLog('error', `SyntaxError: Javascript code`);
  colorLog('error', `Error: "${jsInput}" contains JS errors`);
  return true;
}

/**
 * Gets the installed TypeScript major version.
 * @returns The major version number, or `null` if TypeScript is not installed.
 */
function getTypeScriptMajorVersion(): number | null {
  const result: SpawnSyncReturns<string> = spawnSync('npx', ['tsc', '--version'], {
    stdio: [null, null, null],
    shell: true,
    encoding: 'utf-8',
  });

  if (result.status === 0) {
    const match = result.stdout.trim().match(/Version\s+(\d+)/u);
    return match ? Number(match[1]) : null;
  }

  colorLog('error', 'TypeScript is not installed.');
  colorLog('error', 'Please run "npm install typescript"');
  return null;
}

/**
 * Checks if the given TypeScript file contains syntax errors.
 * @param tsInput - The path to the TypeScript file.
 * @param tsconfigPath - The path to the TypeScript configuration file (optional).
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsTypeScriptSyntaxErrors(tsInput: string, tsConfigPath?: string): boolean {
  const tsMajor = getTypeScriptMajorVersion();
  if (tsMajor !== null) {
    const includeFastEdgeTypes =
      process.env.NODE_ENV === 'test'
        ? []
        : ['--types', './node_modules/@gcoredev/fastedge-sdk-js'];

    // moduleResolution 'node' (node10) is deprecated since TS 5.0;
    // --ignoreDeprecations is only supported in TS >= 5
    const ignoreDeprecationsFlags =
      tsMajor >= 5 ? ['--ignoreDeprecations', tsMajor >= 6 ? '6.0' : '5.0'] : [];

    const defaultTscBuildFlags = [
      '--noEmit',
      '--skipLibCheck',
      '--allowJs',
      '--strict',
      '--target',
      'esnext',
      '--moduleResolution',
      'node',
      ...ignoreDeprecationsFlags,
      ...includeFastEdgeTypes,
      tsInput,
    ];

    const tscBuildFlags = tsConfigPath
      ? ['--project', tsConfigPath, ...ignoreDeprecationsFlags]
      : defaultTscBuildFlags;

    const nodeProcess: SpawnSyncReturns<string> = spawnSync('npx', ['tsc', ...tscBuildFlags], {
      stdio: [null, null, null],
      shell: true,
      encoding: 'utf-8',
    });

    if (nodeProcess.status === 0) {
      return false;
    }

    colorLog('warning', `${nodeProcess.stdout}`);
    colorLog('error', `SyntaxError: Typescript code`);
    colorLog('error', `Error: "${tsInput}" contains Typescript errors`);
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
function containsSyntaxErrors(jsInput: string, tsConfigPath?: string): boolean {
  if (/\.(js|cjs|mjs)$/u.test(jsInput)) {
    return containsJavascriptSyntaxErrors(jsInput);
  }

  if (/\.(ts|tsx|jsx)$/u.test(jsInput)) {
    return containsTypeScriptSyntaxErrors(jsInput, tsConfigPath);
  }

  colorLog('error', `Error: "${jsInput}" is not a valid file type - must be ".js" or ".ts"`);
  return true;
}

export { containsSyntaxErrors };
