import { readFile } from 'node:fs/promises';

import { esBundle } from './es-bundle.ts';

/**
 * Reads the contents of a JavaScript input file, optionally bundling it first.
 *
 * @param jsInput - The path to the JavaScript input file.
 * @param preBundleJSInput - Whether to bundle the input file before reading its contents.
 * @returns A promise that resolves to the contents of the JavaScript file as a string.
 */
async function getJsInputContents(jsInput: string, preBundleJSInput: boolean): Promise<string> {
  if (preBundleJSInput) {
    return esBundle(jsInput);
  }
  return readFile(jsInput, 'utf8');
}

export { getJsInputContents };
