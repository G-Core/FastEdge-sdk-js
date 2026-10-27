import { build, BuildResult, Plugin } from 'esbuild-wasm';

/**
 * A custom esbuild plugin for handling `fastedge::` imports.
 */
const fastedgePackagePlugin: Plugin = {
  name: 'fastedge-package-plugin',
  setup(build) {
    // eslint-disable-next-line require-unicode-regexp
    build.onResolve({ filter: /^fastedge::.*/ }, (args) => ({
      path: args.path.replace('fastedge::', ''),
      namespace: 'fastedge',
    }));
    // eslint-disable-next-line require-unicode-regexp
    build.onLoad({ filter: /^.*/, namespace: 'fastedge' }, async (args) => {
      switch (args.path) {
        case 'env': {
          return { contents: `export const getEnv = globalThis.fastedge.getEnv;` };
        }
        case 'fs': {
          return { contents: `export const readFileSync = globalThis.fastedge.readFileSync;` };
        }
        case 'secret': {
          return {
            contents: `
            export const getSecret = globalThis.fastedge.getSecret;
            export const getSecretEffectiveAt = globalThis.fastedge.getSecretEffectiveAt;
            `,
          };
        }
        case 'kv': {
          return {
            contents: `
            export const KvStore = globalThis.KvStore;
            `,
          };
        }
        case 'cache': {
          return {
            contents: `
            export const Cache = globalThis.Cache;
            `,
          };
        }
        case 'db/sql': {
          return {
            contents: `
            export const SqlDatabase = globalThis.SqlDatabase;
            export const SqlError = globalThis.SqlError;
            `,
          };
        }
        default: {
          return { contents: '' };
        }
      }
    });
  },
};

/**
 * Bundles the provided input file using esbuild.
 *
 * @param input - The path to the input file.
 * @param external - Import specifiers left as imports (e.g. WIT interfaces of components).
 * @returns The bundled output as a string.
 */
async function esBundle(input: string, external: string[] = []): Promise<string> {
  const contents: BuildResult = await build({
    entryPoints: [input],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2023',
    tsconfig: undefined,
    external,
    plugins: [fastedgePackagePlugin],
  });

  // Return the bundled output text
  return contents.outputFiles?.[0].text ?? '';
}

export { esBundle };
