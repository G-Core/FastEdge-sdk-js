import { build } from 'esbuild';

const fastedgePackagePlugin = {
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
        default: {
          return { contents: '' };
        }
      }
    });
  },
};

async function esBundle(input) {
  const contents = await build({
    entryPoints: [input],
    bundle: true,
    write: false,
    tsconfig: undefined,
    plugins: [fastedgePackagePlugin],
  });
  return contents.outputFiles[0].text;
}

export { esBundle };
