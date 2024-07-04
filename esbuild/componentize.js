import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

await build({
  entryPoints: ["./src/componentize.js", "./src/componentize-cli.js"],
  bundle: true,
  outdir: "./",
  platform: "node", // todo: remove this - should be building for browser - i.e. Service Worker
  format: "esm",
  external: [
    "@bytecodealliance/wizer",
    "@bytecodealliance/jco",
    "esbuild",
    "regexpu-core",
    "acorn",
    "magic-string",
    "acorn-walk",
  ],
});

const prependNodeShebangToFile = (relativeFilePath) => {
  const filePath = fileURLToPath(
    new URL(path.resolve(process.cwd(), relativeFilePath), import.meta.url),
  );
  const content = readFileSync(filePath, "utf8");
  writeFileSync(filePath, "#!/usr/bin/env node\n\n" + content);
};

prependNodeShebangToFile("./componentize-cli.js");
