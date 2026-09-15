import { build } from "esbuild";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const entryPoints = [
  { src: "./src/cli/fastedge-assets/asset-cli.ts", dest: "./bin/fastedge-assets.js" },
  { src: "./src/cli/fastedge-build/build.ts", dest: "./bin/fastedge-build.js" },
  { src: "./src/cli/fastedge-init/init.ts", dest: "./bin/fastedge-init.js" },
];

async function buildAll() {
  for (const { src, dest } of entryPoints) {
    await build({
      entryPoints: [src],
      bundle: true,
      outfile: dest,
      platform: "node",
      format: "esm",
      external: [
        "@bytecodealliance/wizer",
        "@bytecodealliance/jco",
        "esbuild",
        "enquirer",
        "regexpu-core",
        "acorn",
        "magic-string",
        "acorn-walk",
      ],
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
  // path.resolve already returns an absolute filesystem path, which is what fs
  // wants. Routing it through `new URL(..., import.meta.url)` + fileURLToPath
  // was a no-op on POSIX and threw on Windows: an absolute Windows path starts
  // with a drive letter, so `D:\a\...` parses as scheme `d:` rather than a path
  // relative to the `file:` base, and fileURLToPath rejects it.
  const filePath = path.resolve(process.cwd(), relativeFilePath);
  const content = readFileSync(filePath, "utf8");
  const shebang = "#!/usr/bin/env node";
  const shebangExists = content.startsWith(shebang);
  if (!shebangExists) {
    writeFileSync(filePath, `${shebang}\n\n${content}`);
  }
};

prependNodeShebangToFile("./bin/fastedge-assets.js");
prependNodeShebangToFile("./bin/fastedge-build.js");
prependNodeShebangToFile("./bin/fastedge-init.js");
