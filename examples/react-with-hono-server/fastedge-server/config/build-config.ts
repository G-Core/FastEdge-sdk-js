const config = {
  type: "static",
  entryPoint: "./fastedge-server/server.ts",
  ignoreDotFiles: true,
  ignoreDirs: ["./node_modules"],
  ignoreWellKnown: false,
  tsConfigPath: "./tsconfig.fastedge.json",
  wasmOutput: "wasm/react-app.wasm",
  publicDir: "./dist",
  assetManifestPath: "./fastedge-server/config/asset-manifest.ts",
  contentTypes: [],
};

export { config };
