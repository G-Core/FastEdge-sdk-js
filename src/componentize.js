import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { dirname, resolve, sep, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { componentNew } from '@bytecodealliance/jco';
import wizer from '@bytecodealliance/wizer';

import { addWasmMetadata } from '~src/add-wasm-metadata';
import { getJsInputContents } from '~src/get-js-input';
import { npxPackagePath, validateFilePaths } from '~src/input-verification';
import { precompile } from '~src/precompile';

async function getTmpDir() {
  return await mkdtemp(normalize(tmpdir() + sep));
}

async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = await npxPackagePath('./lib/fastedge-runtime.wasm'),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true,
  } = opts;

  const jsPath = fileURLToPath(new URL(resolve(process.cwd(), jsInput), import.meta.url));
  console.log('Farq: componentize -> jsPath', jsPath);

  const wasmOutputDir = fileURLToPath(new URL(resolve(process.cwd(), output), import.meta.url));
  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);

  const contents = await getJsInputContents(jsPath, preBundleJSInput);

  const application = precompile(contents);

  let cleanup = () => {};

  // Create a temporary file
  // const tempFile = resolve(os.tmpdir(), 'temp.bundle.js');
  // await writeFile(tempFile, application);
  const tmpDir = await getTmpDir();
  const outPath = resolve(tmpDir, 'input.js');
  await writeFile(outPath, application);
  const wizerInput = outPath;
  cleanup = () => {
    rmSync(tmpDir, { recursive: true });
  };

  try {
    const wizerProcess = spawnSync(
      wizer,
      [
        '--allow-wasi',
        `--wasm-bulk-memory=true`,
        '--inherit-env=true',
        // `--dir=${resolve('/')}`,
        '--dir=.',
        `--dir=${dirname(wizerInput)}`,
        '-r _start=wizer.resume',
        `-o=${wasmOutputDir}`,
        wasmEngine,
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: wizerInput,
        shell: true,
        encoding: 'utf-8',
        env: {
          // ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS:
          //   enableExperimentalHighResolutionTimeMethods ? "1" : "0",
          ENABLE_PBL: enablePBL ? '1' : '0',
          ...process.env,
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

  // // Delete the temporary file
  // await unlink(tempFile);

  const coreComponent = await readFile(output);
  const adapter = fileURLToPath(new URL('./lib/preview1-adapter.wasm', import.meta.url));

  const generatedComponent = await componentNew(coreComponent, [
    ['wasi_snapshot_preview1', await readFile(adapter)],
  ]);

  await writeFile(output, generatedComponent);
  await addWasmMetadata(output);
}

export { componentize };
