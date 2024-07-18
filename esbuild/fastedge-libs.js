import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const libFolder = "./lib/";
const entryPoints = [{ src: "./src/static-server/index.js", filename: "static-server.js" }];

async function buildAll() {
  for (const { src, filename } of entryPoints) {
    await build({
      entryPoints: [src],
      bundle: true,
      outfile: `${libFolder}${filename}`,
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

function createMainEntrypointFile() {
  const fileContents = entryPoints
    .map(({ filename }) => `export * from "./${filename.replace(libFolder, "")}";`)
    .join("\n");

  writeFileSync(`${libFolder}index.js`, fileContents);
}

createMainEntrypointFile();
