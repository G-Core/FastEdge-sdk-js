import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const libFolder = "./lib/";
const entryPoints = [
  {
    src: "./src/server/static-assets/static-server/create-static-server.ts",
    filename: "create-static-server.js",
  },
];

async function buildAll() {
  for (const { src, filename } of entryPoints) {
    await build({
      entryPoints: [src],
      bundle: true,
      outfile: `${libFolder}${filename}`,
      format: "esm",
      external: ["fastedge::fs"],
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
