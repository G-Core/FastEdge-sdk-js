import { pathToFileURL } from 'node:url';

import { npxPackagePath } from '~utils/npx-path.ts';

/**
 * Imports a vendored, jco-transpiled module from the package root. Not bundled into the CLI,
 * because each module locates its .wasm next to itself.
 * @param relativePath - Path from the package root, e.g. `./vendor/x/x.js`.
 * @returns The module namespace.
 */
async function importVendored<T>(relativePath: string): Promise<T> {
  const url = pathToFileURL(npxPackagePath(relativePath)).href;
  return import(/* webpackChunkName: "vendored" */ url);
}

export { importVendored };
