import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { componentNew } from '@bytecodealliance/jco';
import wizer from '@bytecodealliance/wizer';

import { getJsInputContents } from '~src/get-js-input';
import { injectJSBuiltins } from '~src/inject-js-builtins';
import { validateFilePaths } from '~src/input-verification';
import { precompile } from '~src/precompile';

async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = fileURLToPath(new URL('./lib/fastedge-runtime.wasm', import.meta.url)),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true,
  } = opts;

  const jsPath = fileURLToPath(new URL(path.resolve(process.cwd(), jsInput), import.meta.url));
  const wasmOutputDir = fileURLToPath(
    new URL(path.resolve(process.cwd(), output), import.meta.url),
  );

  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);

  const contents = await getJsInputContents(jsPath, preBundleJSInput);

  const application = precompile(injectJSBuiltins(contents));

  try {
    const wizerProcess = spawnSync(
      wizer,
      [
        '--inherit-env=true',
        '--allow-wasi',
        `--dir=.`,
        `--wasm-bulk-memory=true`,
        '-r _start=wizer.resume',
        `-o=${output}`,
        wasmEngine,
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: application,
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
  }
  const coreComponent = await readFile(output);
  const adapter = fileURLToPath(
    new URL('./lib/wasi_snapshot_preview1.reactor.wasm', import.meta.url),
  );

  const generatedComponent = await componentNew(coreComponent, [
    ['wasi_snapshot_preview1', await readFile(adapter)],
  ]);

  await writeFile(output, generatedComponent);
}

export { componentize };
