const config = {
  type: "http",
  tsConfigPath: "./tsconfig.json",
  entryPoint: "src/index.ts",
  wasmOutput: "dist/kv-store.wasm",
};

const serverConfig = {
  type: "http",
};

export { config, serverConfig };
