import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { metadataAdd } from '@bytecodealliance/jco';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function addWasmMetadata(wasmPath) {
  const packageJson = await readFile(join(__dirname, './package.json'), {
    encoding: 'utf-8',
  });
  const { name, version } = JSON.parse(packageJson);
  // TODO: Farq: Sort out the version and changelog push
  const metadata = [['processed-by', [[name, version]]]];
  const wasm = await readFile(wasmPath);
  const newWasm = await metadataAdd(wasm, metadata);
  await writeFile(wasmPath, newWasm);
}
