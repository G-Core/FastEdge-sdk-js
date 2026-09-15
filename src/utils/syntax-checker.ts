import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import { colorLog } from '~utils/color-log.ts';

interface ResolvedTypeScript {
  major: number;
  tscPath: string;
}

interface TypeScriptManifest {
  version: string;
  bin?: string | Record<string, string>;
}

/**
 * Locates the TypeScript installed alongside the project being built.
 *
 * The version is whatever the consumer installed, so this has to work across
 * majors that package themselves differently:
 *
 *  - Resolving `typescript/package.json` (exported by every version) and then
 *    reading its own `bin` field avoids subpath resolution. TS 7 ships an
 *    "exports" map that does not expose `./bin/tsc`, so asking for that
 *    subpath directly throws on TS 7 while succeeding on TS 5.
 *  - Running that file under `process.execPath` needs no shell on any
 *    platform. Shelling out to `npx` would: it is a `.cmd` shim on Windows,
 *    and since the fix for CVE-2024-27980 Node refuses to spawn `.bat`/`.cmd`
 *    without `shell: true` - which is exactly what must not come back here.
 *
 * @returns The major version and `tsc` path, or `null` if TypeScript is not usable.
 */
function resolveTypeScript(): ResolvedTypeScript | null {
  try {
    const require = createRequire(join(process.cwd(), 'package.json'));
    const manifestPath = require.resolve('typescript/package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as TypeScriptManifest;

    const binEntry = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.tsc;
    if (!binEntry) {
      return null;
    }

    const tscPath = resolve(dirname(manifestPath), binEntry);
    if (!existsSync(tscPath)) {
      return null;
    }

    return { major: Number(manifest.version.split('.')[0]), tscPath };
  } catch {
    return null;
  }
}

/**
 * Checks if the given JavaScript file contains syntax errors.
 * @param jsInput - The path to the JavaScript file.
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsJavascriptSyntaxErrors(jsInput: string): boolean {
  const nodeProcess: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    ['--check', jsInput],
    {
      stdio: [null, null, null],
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
 * Checks if the given TypeScript file contains syntax errors.
 * @param tsInput - The path to the TypeScript file.
 * @param tsconfigPath - The path to the TypeScript configuration file (optional).
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
function containsTypeScriptSyntaxErrors(tsInput: string, tsConfigPath?: string): boolean {
  const typescript = resolveTypeScript();

  if (typescript === null) {
    colorLog('error', 'TypeScript is not installed.');
    colorLog('error', 'Please run "npm install typescript"');
    return true;
  }

  const includeFastEdgeTypes =
    process.env.NODE_ENV === 'test'
      ? []
      : ['--types', './node_modules/@gcoredev/fastedge-sdk-js'];

  // 'bundler' resolution matches how the SDK actually consumes input (it is
  // bundled with esbuild before componentization) and is supported from
  // TS 5.0. The previous 'node' value means node10, which was deprecated in
  // TS 5 and *removed* in TS 7 - so every .ts build failed with TS5108 once
  // a consumer had TS 7 installed.
  const moduleResolution = typescript.major >= 5 ? 'bundler' : 'node';

  // Only needed for a consumer's own tsconfig, which may use options that are
  // deprecated but still functional (preserveValueImports, keyofStringsOnly,
  // moduleResolution: node, ...). Without this, projects that build today are
  // rejected. The accepted value is tied to the major that deprecated them -
  // TS 6 rejects "5.0" with TS5107 and demands "6.0" - and from TS 7 on the
  // options are removed outright, where no value suppresses anything and the
  // consumer has to update their config.
  // Our own default flags never use a deprecated option, so they need none.
  const deprecationsVersion = typescript.major >= 6 ? '6.0' : '5.0';
  const ignoreDeprecations =
    typescript.major >= 5 && typescript.major < 7
      ? ['--ignoreDeprecations', deprecationsVersion]
      : [];

  // `--module` is set explicitly for two reasons. `bundler` resolution
  // requires module `preserve` or es2015+, and leaving it implicit makes that
  // depend on `--target` staying high (TS derives module from target, so
  // lowering the target would fail with TS5095). More importantly, the value
  // TS infers from `--target esnext` is es2015, which rejects `import.meta`
  // with TS1343 even though it is valid ESM that the runtime supports.
  // `esnext` matches how input is actually consumed: esbuild bundles ESM.

  // TS 7 (Go rewrite) errors (TS5112) when a file is passed on the command
  // line and a tsconfig.json exists in the CWD. We control all flags
  // explicitly here, so ignoring any ambient tsconfig is correct.
  const ignoreConfig = typescript.major >= 7 ? ['--ignoreConfig'] : [];

  const defaultTscBuildFlags = [
    '--noEmit',
    '--skipLibCheck',
    '--allowJs',
    '--strict',
    '--target',
    'esnext',
    '--module',
    'esnext',
    '--moduleResolution',
    moduleResolution,
    ...ignoreConfig,
    ...includeFastEdgeTypes,
    tsInput,
  ];

  const tscBuildFlags = tsConfigPath
    ? ['--project', tsConfigPath, ...ignoreDeprecations]
    : defaultTscBuildFlags;

  const nodeProcess: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [typescript.tscPath, ...tscBuildFlags],
    {
      stdio: [null, null, null],
      encoding: 'utf-8',
    },
  );

  if (nodeProcess.status === 0) {
    return false;
  }

  colorLog('warning', `${nodeProcess.stdout}`);
  colorLog('error', `SyntaxError: Typescript code`);
  colorLog('error', `Error: "${tsInput}" contains Typescript errors`);
  return true;
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
