import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { componentNew } from '@bytecodealliance/jco';
import wizer from '@bytecodealliance/wizer';

import { getTmpDir, npxPackagePath, resolveTmpDir } from 'src/utils/file-system';
import { validateFilePaths } from 'src/utils/input-path-verification';

import { addWasmMetadata } from './add-wasm-metadata';
import { getJsInputContents } from './get-js-input';
import { precompile } from './precompile';

async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = await npxPackagePath('./lib/fastedge-runtime.wasm'),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true,
  } = opts;

  const jsPath = fileURLToPath(new URL(resolve(process.cwd(), jsInput), import.meta.url));

  const wasmOutputDir = fileURLToPath(new URL(resolve(process.cwd(), output), import.meta.url));
  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);

  const contents = await getJsInputContents(jsPath, preBundleJSInput);

  //  todo: farq: Can I remove this step?? regex collection?
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

  const coreComponent = await readFile(output);
  const adapter = fileURLToPath(
    new URL(npxPackagePath('./lib/preview1-adapter.wasm'), import.meta.url),
  );

  const generatedComponent = await componentNew(coreComponent, [
    ['wasi_snapshot_preview1', await readFile(adapter)],
  ]);

  await writeFile(output, generatedComponent);
  await addWasmMetadata(output);
}

export { componentize };
