import path from 'node:path';

import type { BuildConfig } from './types.ts';

import { componentize } from '~componentize/componentize.ts';
import {
  COMPONENT_TYPES_FILE,
  removeComponentTypes,
  writeComponentTypes,
} from '~componentize/components.ts';
import { createStaticAssetsManifest } from '~static-assets/asset-manifest/create-manifest.ts';
import { colorLog } from '~utils/color-log.ts';
import { isFile, resolveOsPath } from '~utils/file-system.ts';
import { validateFilePaths } from '~utils/input-path-verification.ts';
import { loadConfig } from '~utils/load-config-file.ts';

/**
 * Builds a WebAssembly file from the provided input and output paths.
 * @param options - The input and output file paths.
 */
async function buildWasm({
  entryPoint,
  wasmOutput,
  tsConfigPath,
  components,
}: BuildConfig): Promise<void> {
  const hasComponents = components !== undefined && Object.keys(components).length > 0;
  const componentTypes = path.join(path.dirname(entryPoint), COMPONENT_TYPES_FILE);
  if (!hasComponents && process.env.NODE_ENV !== 'test') {
    await removeComponentTypes(componentTypes);
  }
  if (hasComponents && process.env.NODE_ENV !== 'test') {
    // The full validation runs after; this only guards the write below.
    if (!(await isFile(entryPoint))) {
      colorLog('error', `Error: Input "${entryPoint}" is not a file`);
      process.exit(1);
    }
    // Declarations for `import ... from 'ns:pkg/iface'`, next to the entry point so a typical
    // tsconfig `include` picks them up. Written before the syntax check, which needs them.
    await writeComponentTypes(components, componentTypes);
  }
  await validateFilePaths(entryPoint, wasmOutput, tsConfigPath);
  if (process.env.NODE_ENV !== 'test') {
    await componentize(entryPoint, wasmOutput, hasComponents ? { components } : {});
  }
}

/**
 * Builds the project based on the provided configuration.
 * @param config - The configuration object.
 * @returns Whether a wasm was built.
 */
async function buildFromConfig(config: BuildConfig | null): Promise<boolean> {
  if (!config) return false;

  switch (config.type) {
    case 'static': {
      await createStaticAssetsManifest(config);
      await buildWasm(config);
      colorLog('success', `Success: Built ${config.wasmOutput}`);
      return true;
    }
    case 'http': {
      await buildWasm(config);
      colorLog('success', `Success: Built ${config.wasmOutput}`);
      return true;
    }
    default: {
      colorLog('error', 'Error: Invalid config type. Must be one of: static, http.');
      return false;
    }
  }
}

/**
 * Builds the project from multiple configuration files.
 * @param configFilePaths - The paths to the configuration files.
 */
async function buildFromConfigFiles(configFilePaths: string[] = []): Promise<void> {
  for (const configFilePath of configFilePaths) {
    const configPath = resolveOsPath(configFilePath);
    // Await in loop is correct, it must run sequentially - it overwrites files within each build cycle
    // eslint-disable-next-line no-await-in-loop
    await buildFromConfig(await loadConfig<BuildConfig>(configPath));
  }
  process.exit(0);
}

/**
 * Builds one configuration file, writing the wasm to `wasmOutput` instead of the config's own.
 * Unlike buildFromConfigFiles, a missing config or an invalid type fails the build.
 * @param configFilePath - The path to the configuration file.
 * @param wasmOutput - Output filepath for the wasm.
 */
async function buildFromConfigFileTo(configFilePath: string, wasmOutput: string): Promise<void> {
  const config = await loadConfig<BuildConfig>(resolveOsPath(configFilePath));
  const built = config !== null && (await buildFromConfig({ ...config, wasmOutput }));
  process.exit(built ? 0 : 1);
}

export { buildFromConfigFiles, buildFromConfigFileTo, buildWasm };
