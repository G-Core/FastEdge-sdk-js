import { readFile } from 'node:fs/promises';

import { preBundle } from '~src/pre-bundle';

async function getJsInputContents(jsInput, preBundleJSInput) {
  if (preBundleJSInput) {
    return preBundle(jsInput);
  }
  return readFile(jsInput, 'utf8');
}

export { getJsInputContents };
