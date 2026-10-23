export const config = {
  type: 'http',
  tsConfigPath: './tsconfig.json',
  entryPoint: './src/index.ts',
  wasmOutput: './dist/component-imports.wasm',
  // WIT interface the app imports → component that exports it
  components: {
    'example:image/thumbnail': './thumbnail.wasm',
  },
};
