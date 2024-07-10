import { build } from 'esbuild';

const fastedgePackagePlugin = {
  name: 'fastedge-package-plugin',
  setup(build) {
    build.onResolve({ filter: /^fastedge::.*/u }, (args) => ({
      path: args.path.replace('fastedge::', ''),
      namespace: 'fastedge',
    }));
    build.onLoad({ filter: /^.*/u, namespace: 'fastedge' }, async (args) => {
      switch (args.path) {
        case 'env': {
          return { contents: `export const getEnv = globalThis.fastedge.getEnv;` };
        }
        // todo: farq: remove this includebytes here and in runtime.cpp
        case 'includebytes': {
          return { contents: `export const includeBytes = globalThis.fastedge.includeBytes;` };
        }
        case 'fs': {
          return { contents: `export const readFileSync = globalThis.fastedge.readFileSync;` };
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
