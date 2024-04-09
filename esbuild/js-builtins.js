import { build } from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

await build({
  entryPoints: ["./fastedge-runtime/js-builtins/index.js"],
  bundle: true,
  outfile: "./lib/js-builtins.js",
  platform: "node",
  format: "esm",
  plugins: [
    polyfillNode({
      buffer: false,
      process: false,
      events: true,
    }),
  ],
});
