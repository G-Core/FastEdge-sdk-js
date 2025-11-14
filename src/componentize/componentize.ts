import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { componentNew } from '@bytecodealliance/jco';
import wizer from '@bytecodealliance/wizer';

import { addWasmMetadata } from '~componentize/add-wasm-metadata.ts';
import { getJsInputContents } from '~componentize/get-js-input.ts';
import { precompile } from '~componentize/precompile.ts';

import { getTmpDir, resolveOsPath, resolveTmpDir, useUnixPath } from '~utils/file-system.ts';
import { validateFileExists } from '~utils/input-path-verification.ts';
import { npxPackagePath } from '~utils/npx-path.ts';

/**
 * Options for the `componentize` function.
 */
interface ComponentizeOptions {
  debug?: boolean;
  wasmEngine?: string;
  enableStdout?: boolean;
  enablePBL?: boolean;
  preBundleJSInput?: boolean;
}

/**
 * Converts JavaScript input into a WebAssembly component.
 * Ensure that jsInput and output are valid file paths before calling componentize.
 * (see: src/utils/input-path-verification.ts:validateFilePaths)
 *
 * @param jsInput - The path to the JavaScript input file.
 * @param output - The path to the output WebAssembly file.
 * @param opts - Options for the componentization process.
 */
async function componentize(
  jsInput: string,
  output: string,
  opts: ComponentizeOptions = {},
): Promise<void> {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debug = false,
    wasmEngine = npxPackagePath('./lib/fastedge-runtime.wasm'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true,
  } = opts;

  const jsPath = resolveOsPath(process.cwd(), jsInput);
  console.warn('Farq: componentize >> jsPath', jsPath);
  const wasmOutputDir = resolveOsPath(process.cwd(), output);
  console.warn('Farq: componentize >> wasmOutputDir', wasmOutputDir);

  await validateFileExists(wasmEngine);

  const contents = await getJsInputContents(jsPath, preBundleJSInput);
  console.warn('Farq: componentize >> contents', contents);
  const application = precompile(contents);

  // Create a temporary file
  const tmpDir = await getTmpDir();
  const outPath = resolveTmpDir(tmpDir);
  await writeFile(outPath, application);
  const wizerInput = outPath;
  console.warn('Farq: componentize >> wizerInput', wizerInput);

  const cleanup = (): void => {
    rmSync(tmpDir, { recursive: true });
  };

  console.warn(
    'Farq: componentize >> shared directories for Wizer',
    JSON.stringify(['.', useUnixPath(dirname(wizerInput))]),
  );

  console.warn('Farq: componentize >> output Dir for Wizer', useUnixPath(wasmOutputDir));

  console.warn('Farq: componentize >> wasmEngine for Wizer', useUnixPath(wasmEngine));

  try {
    const wizerProcess: SpawnSyncReturns<string> = spawnSync(
      wizer,
      [
        '--allow-wasi',
        '--wasm-bulk-memory=true',
        '--wasm-reference-types=true',
        '--inherit-env=true',
        '--dir=.',
        '--dir=/workspace',
        // '--dir=../', // Farq: NEED to iterate config file and add these paths for static building...
        `--dir=${useUnixPath(dirname(wizerInput))}`,
        '-r _start=wizer.resume',
        `-o=${useUnixPath(wasmOutputDir)}`,
        useUnixPath(wasmEngine),
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: useUnixPath(wizerInput),
        shell: true,
        encoding: 'utf-8',
        env: {
          // ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS:
          //   enableExperimentalHighResolutionTimeMethods ? "1" : "0",
          ENABLE_PBL: enablePBL ? '1' : '0',
          // ...process.env,
        },
      },
    );

    if (wizerProcess.status !== 0) {
      throw new Error(`Wizer initialization failure`);
    }
    process.exitCode = wizerProcess.status;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error('Error: Failed to compile JavaScript to Wasm:', (error as Error).message);
    }
    process.exit(1);
  } finally {
    cleanup();
  }

  // Core component creation code (commented out for now)
  const coreComponent = await readFile(output);
  const adapter = npxPackagePath('./lib/preview1-adapter.wasm');

  const generatedComponent = await componentNew(coreComponent, [
    ['wasi_snapshot_preview1', await readFile(adapter)],
  ]);

  await writeFile(output, generatedComponent);
  await addWasmMetadata(output);
}

export { componentize };
export type { ComponentizeOptions };
