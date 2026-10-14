// Module resolve hook: rejects the packages whose platform binaries a foreign-OS
// node_modules would lack. fastedge-build must use esbuild-wasm, the wasm-only
// jco-transpile entry, and FASTEDGE_WIZER_PATH instead.
const BLOCKED = [
  /^esbuild$/u,
  /^@esbuild\//u,
  /^@bytecodealliance\/jco$/u,
  /^@bytecodealliance\/wizer(?:$|\/|-)/u,
];

export async function resolve(specifier, context, nextResolve) {
  if (BLOCKED.some((re) => re.test(specifier))) {
    throw new Error(`native package blocked: ${specifier}`);
  }
  return nextResolve(specifier, context);
}
