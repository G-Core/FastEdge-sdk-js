import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { componentNew } from '@bytecodealliance/jco-transpile/wasm-tools';

import type { ComponentImports, LoadedComponents } from '~componentize/components.ts';

import { addWasmMetadata } from '~componentize/add-wasm-metadata.ts';
import {
  composeComponents,
  importWorld,
  loadComponents,
  restoreEngineBindings,
  spliceImports,
} from '~componentize/components.ts';
import { getJsInputContents } from '~componentize/get-js-input.ts';
import { precompile } from '~componentize/precompile.ts';

import { colorLog } from '~utils/color-log.ts';
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
  /** Wasm components to compose in, keyed by the WIT interface the app imports. */
  components?: ComponentImports;
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
    components = {},
  } = opts;

  const jsPath = resolveOsPath(process.cwd(), jsInput);
  const wasmOutputDir = resolveOsPath(process.cwd(), output);

  await validateFileExists(wasmEngine);

  let loaded: LoadedComponents | undefined;
  let witWorld = '';
  if (Object.keys(components).length > 0) {
    try {
      loaded = await loadComponents(components);
      witWorld = await importWorld(loaded);
    } catch (error) {
      colorLog('error', `Error: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  const contents = await getJsInputContents(jsPath, preBundleJSInput, Object.keys(components));
  // The splice flow loads the app as an ES module: it keeps its component `import`s.
  const application = loaded ? precompile(contents, undefined, 'module') : precompile(contents);

  // Create a temporary file
  const tmpDir = await getTmpDir();
  const outPath = resolveTmpDir(tmpDir);
  await writeFile(outPath, application);
  const wizerInput = outPath;
  // Splice flow: wizer runs the spliced engine's `componentize.wizer` instead of `wizer.resume`
  let wizerEngine = wasmEngine;
  let wizerStdin = useUnixPath(wizerInput);
  let wizerEntry = ['-r', '_start=wizer.resume'];
  let spliceEnv: Record<string, string> = {};

  const cleanup = (): void => {
    rmSync(tmpDir, { recursive: true });
  };

  try {
    // FASTEDGE_WIZER_PATH lets a build host (e.g. a Linux container building a
    // project installed on macOS) supply its own wizer binary. Import lazily:
    // the package throws at load time when this platform's binary is missing.
    if (loaded) {
      const spliced = await spliceImports(wasmEngine, witWorld, application, tmpDir);
      wizerEngine = spliced.engine;
      wizerStdin = spliced.input;
      wizerEntry = ['--init-func', 'componentize.wizer'];
      spliceEnv = spliced.env;
    }
    let wizer = process.env.FASTEDGE_WIZER_PATH;
    if (!wizer) {
      ({ default: wizer } = await import(/* webpackChunkName: "wizer" */ '@bytecodealliance/wizer'));
    }
    const wizerProcess: SpawnSyncReturns<string> = spawnSync(
      wizer,
      [
        '--allow-wasi',
        '--wasm-bulk-memory=true',
        '--wasm-reference-types=true',
        '--inherit-env=true',
        '--dir=.',
        // '--dir=../', // Could iterate config file and add these paths for static building... ( enhancement for later, if required )
        `--dir=${useUnixPath(dirname(wizerInput))}`,
        // Two argv entries, not one. This previously relied on `shell: true`
        // word-splitting a single "-r _start=wizer.resume" string.
        ...wizerEntry,
        `-o=${useUnixPath(wasmOutputDir)}`,
        useUnixPath(wizerEngine),
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: wizerStdin,
        // No `shell: true`: `wizer` is an absolute path to a binary, and a
        // shell would re-parse the interpolated output/dir paths as syntax.
        encoding: 'utf-8',
        env: {
          // ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS:
          //   enableExperimentalHighResolutionTimeMethods ? "1" : "0",
          ENABLE_PBL: enablePBL ? '1' : '0',
          ...spliceEnv,
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
  let coreComponent: Uint8Array = await readFile(output);
  const adapter = npxPackagePath('./lib/preview1-adapter.wasm');

  const newComponent = async (core: Uint8Array): Promise<Uint8Array> =>
    componentNew(core, [['wasi_snapshot_preview1', await readFile(adapter)]]);

  let generatedComponent: Uint8Array;
  if (loaded) {
    try {
      coreComponent = await restoreEngineBindings(wasmEngine, coreComponent);
      generatedComponent = await composeComponents(await newComponent(coreComponent), loaded);
    } catch (error) {
      // Don't leave Wizer's intermediate core module at the output path
      rmSync(output, { force: true });
      colorLog('error', `Error: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    generatedComponent = await newComponent(coreComponent);
  }

  await writeFile(output, generatedComponent);
  await addWasmMetadata(output);
}

export { componentize };
export type { ComponentizeOptions };
