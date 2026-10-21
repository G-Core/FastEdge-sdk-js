export const config = {
  type: 'http',
  entryPoint: './src/index.js',
  wasmOutput: './dist/component-imports.wasm',
  // WIT interface the app imports → component that exports it
  components: {
    'regexped:urlguard/sets': './urlguard.wasm',
  },
};
