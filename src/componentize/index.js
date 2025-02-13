import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { componentNew } from '@bytecodealliance/jco';
import wizer from '@bytecodealliance/wizer';

import { addWasmMetadata } from './add-wasm-metadata.js';
import { getJsInputContents } from './get-js-input.js';
import { precompile } from './precompile.js';

import {
  getTmpDir,
  npxPackagePath,
  resolveOsPath,
  resolveTmpDir,
  useUnixPath,
} from '~utils/file-system.js';
import { validateFilePaths } from '~utils/input-path-verification.js';

async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = npxPackagePath('./lib/fastedge-runtime.wasm'),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true,
  } = opts;

  const jsPath = resolveOsPath(process.cwd(), jsInput);

  const wasmOutputDir = resolveOsPath(process.cwd(), output);

  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);

  const contents = await getJsInputContents(jsPath, preBundleJSInput);

  const application = precompile(contents);

  // Create a temporary file
  const tmpDir = await getTmpDir();
  const outPath = resolveTmpDir(tmpDir);
  await writeFile(outPath, application);
  const wizerInput = outPath;
  const cleanup = () => {
    rmSync(tmpDir, { recursive: true });
  };

  try {
    const wizerProcess = spawnSync(
      wizer,
      [
        '--allow-wasi',
        `--wasm-bulk-memory=true`,
        '--inherit-env=true',
        '--dir=.',
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
      console.error('Error: Failed to compile JavaScript to Wasm:', error.message);
    }
    process.exit(1);
  } finally {
    cleanup();
  }

  const coreComponent = await readFile(output);
  const adapter = npxPackagePath('./lib/preview1-adapter.wasm');

  const generatedComponent = await componentNew(coreComponent, [
    ['wasi_snapshot_preview1', await readFile(adapter)],
  ]);

  await writeFile(output, generatedComponent);
  await addWasmMetadata(output);
}

export { componentize };
