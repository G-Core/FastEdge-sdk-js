import { build } from 'esbuild';

async function preBundle(input) {
  const contents = await build({
    entryPoints: [input],
    bundle: true,
    write: false,
    tsconfig: undefined,
  });
  return contents.outputFiles[0].text;
}

export { preBundle };
