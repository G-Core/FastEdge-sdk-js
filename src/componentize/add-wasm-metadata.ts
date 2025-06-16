import { readFile, writeFile } from 'node:fs/promises';
import { metadataAdd } from '@bytecodealliance/jco';

import { npxPackagePath } from '~utils/file-system.ts';

/**
 * Adds metadata to a WebAssembly file.
 *
 * @param wasmPath - The path to the WebAssembly file.
 * @returns A promise that resolves when the metadata has been added.
 */
export async function addWasmMetadata(wasmPath: string): Promise<void> {
  // Read the package.json file
  const packageJson = await readFile(npxPackagePath('./package.json'), {
    encoding: 'utf-8',
  });

  // Parse the package.json file to extract name and version
  const { name, version }: { name: string; version: string } = JSON.parse(packageJson);

  // Name and version is updated via Semantic-Release, repo version is not used.
  const metadata: [[string, [[string, string]]]] = [['processed-by', [[name, version]]]];

  // Read the WebAssembly file
  const wasm = await readFile(wasmPath);

  // Add metadata to the WebAssembly file
  const newWasm = await metadataAdd(wasm, metadata);

  // Write the updated WebAssembly file back to disk
  await writeFile(wasmPath, newWasm);
}
