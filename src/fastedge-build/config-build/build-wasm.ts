import { componentize } from 'src/componentize/index.ts';

import { validateFilePaths } from '~utils/input-path-verification.ts';

/**
 * Represents the input and output file paths for building WebAssembly.
 */
interface BuildWasmOptions {
  input: string;
  output: string;
}

/**
 * Builds a WebAssembly file from the provided input and output paths.
 * @param options - The input and output file paths.
 */
async function buildWasm({ input, output }: BuildWasmOptions): Promise<void> {
  await validateFilePaths(input, output);
  if (process.env.NODE_ENV !== 'test') {
    await componentize(input, output);
  }
}

export { buildWasm };
export type { BuildWasmOptions };
