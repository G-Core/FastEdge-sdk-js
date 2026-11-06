import { build, BuildResult, Plugin } from 'esbuild-wasm';

/**
 * A custom esbuild plugin for handling `fastedge::` imports.
 */
const fastedgePackagePlugin: Plugin = {
  name: 'fastedge-package-plugin',
  setup(build) {
    // eslint-disable-next-line require-unicode-regexp
    build.onResolve({ filter: /^fastedge::.*/ }, (args) => ({
      path: args.path.replace('fastedge::', ''),
      namespace: 'fastedge',
    }));
    // eslint-disable-next-line require-unicode-regexp
    build.onLoad({ filter: /^.*/, namespace: 'fastedge' }, async (args) => {
      switch (args.path) {
        case 'env': {
          return { contents: `export const getEnv = globalThis.fastedge.getEnv;` };
        }
        case 'fs': {
          return { contents: `export const readFileSync = globalThis.fastedge.readFileSync;` };
        }
        case 'secret': {
          return {
            contents: `
            export const getSecret = globalThis.fastedge.getSecret;
            export const getSecretEffectiveAt = globalThis.fastedge.getSecretEffectiveAt;
            `,
          };
        }
        case 'kv': {
          return {
            contents: `
            export const KvStore = globalThis.KvStore;
            `,
          };
        }
        case 'cache': {
          return {
            contents: `
            export const Cache = globalThis.Cache;
            `,
          };
        }
        case 'db/sql': {
          return {
            contents: `
            export const SqlDatabase = globalThis.SqlDatabase;
            export const SqlError = globalThis.SqlError;
            `,
          };
        }
        case 'db/postgres': {
          // The db/sql builtins under PostgreSQL names; same classes, so instanceof matches both.
          return {
            contents: `
            export const PostgresDatabase = globalThis.SqlDatabase;
            export const PostgresError = globalThis.SqlError;
            export const SQLSTATE = Object.freeze({
              UNIQUE_VIOLATION: '23505',
              FOREIGN_KEY_VIOLATION: '23503',
              NOT_NULL_VIOLATION: '23502',
              CHECK_VIOLATION: '23514',
              EXCLUSION_VIOLATION: '23P01',
              INVALID_TEXT_REPRESENTATION: '22P02',
              NUMERIC_VALUE_OUT_OF_RANGE: '22003',
              STRING_DATA_RIGHT_TRUNCATION: '22001',
              DIVISION_BY_ZERO: '22012',
              UNDEFINED_TABLE: '42P01',
              UNDEFINED_COLUMN: '42703',
              UNDEFINED_FUNCTION: '42883',
              SYNTAX_ERROR: '42601',
              INSUFFICIENT_PRIVILEGE: '42501',
              SERIALIZATION_FAILURE: '40001',
              DEADLOCK_DETECTED: '40P01',
              QUERY_CANCELED: '57014',
              INVALID_PASSWORD: '28P01',
              INVALID_CATALOG_NAME: '3D000',
            });
            `,
          };
        }
        case 'db/kv': {
          return {
            contents: `
            export const KvDatabase = globalThis.KvDatabase;
            export const KvError = globalThis.KvError;
            `,
          };
        }
        default: {
          return { contents: '' };
        }
      }
    });
  },
};

/**
 * Bundles the provided input file using esbuild.
 *
 * @param input - The path to the input file.
 * @param external - Import specifiers left as imports (e.g. WIT interfaces of components).
 * @returns The bundled output as a string.
 */
async function esBundle(input: string, external: string[] = []): Promise<string> {
  const contents: BuildResult = await build({
    entryPoints: [input],
    bundle: true,
    write: false,
    format: 'esm',
    target: 'es2023',
    tsconfig: undefined,
    external,
    plugins: [fastedgePackagePlugin],
  });

  // Return the bundled output text
  return contents.outputFiles?.[0].text ?? '';
}

export { esBundle };
