import { build } from "esbuild";

const entryPoints = [{ src: "./src/static-server/index.js", dest: "./lib/static-server.js" }];

async function buildAll() {
  for (const { src, dest } of entryPoints) {
    await build({
      entryPoints: [src],
      bundle: true,
      outfile: dest,
      format: "esm",
      external: [
        "fastedge::fs",
        //   "@bytecodealliance/wizer",
        //   "@bytecodealliance/jco",
        //   "esbuild",
        //   "regexpu-core",
        //   "acorn",
        //   "magic-string",
        //   "acorn-walk",
      ],
      // sourcemap: true,
      logLevel: "info",
    });
  }
}

try {
  await buildAll();
} catch (e) {
  console.error("Build Failed:", e);
}
