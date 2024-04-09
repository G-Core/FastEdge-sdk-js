import { build } from "esbuild";

await build({
  entryPoints: ["./src/componentize.js", "./src/componentize-cli.js"],
  bundle: true,
  outdir: "./",
  platform: "node",
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
