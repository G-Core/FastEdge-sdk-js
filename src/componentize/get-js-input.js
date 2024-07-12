import { readFile } from 'node:fs/promises';

import { esBundle } from './es-bundle.js';

async function getJsInputContents(jsInput, preBundleJSInput) {
  if (preBundleJSInput) {
    return esBundle(jsInput);
  }
  return readFile(jsInput, 'utf8');
}

export { getJsInputContents };
