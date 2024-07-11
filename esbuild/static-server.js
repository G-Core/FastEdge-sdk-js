import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const entryPoints = [{ src: "./src/static-server/index.js", dest: "./build/static-server.js" }];

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

const prependNodeShebangToFile = (relativeFilePath) => {
  const filePath = fileURLToPath(
    new URL(path.resolve(process.cwd(), relativeFilePath), import.meta.url),
  );
  const content = readFileSync(filePath, "utf8");
  writeFileSync(filePath, "#!/usr/bin/env node\n\n" + content);
};

prependNodeShebangToFile("./bin/fastedge-build.js");
