import { readFile, writeFile } from 'node:fs/promises';

import { metadataAdd } from '@bytecodealliance/jco';

import { npxPackagePath } from '~utils/file-system.js';

export async function addWasmMetadata(wasmPath) {
  const packageJson = await readFile(npxPackagePath('./package.json'), {
    encoding: 'utf-8',
  });
  const { name, version } = JSON.parse(packageJson);
  // TODO: Farq: Sort out the version and changelog when push
  const metadata = [['processed-by', [[name, version]]]];
  const wasm = await readFile(wasmPath);
  const newWasm = await metadataAdd(wasm, metadata);
  await writeFile(wasmPath, newWasm);
}
