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
          // POC: public API over the raw `__fastedgeDbSql` builtin (runtime/fastedge/builtins/db-sql.cpp).
          return {
            contents: `
            const raw = globalThis.__fastedgeDbSql;
            const JSON_OIDS = [114, 3802];
            export class SqlError extends Error {
              constructor(e) { super(e.message); this.name = 'SqlError'; Object.assign(this, e); }
            }
            const call = (fn) => {
              try { return fn(); } catch (e) { throw e instanceof Error ? e : new SqlError(e); }
            };
            const param = (v) =>
              v instanceof Date ? v.toISOString()
              : v !== null && typeof v === 'object' && !(v instanceof Uint8Array) ? JSON.stringify(v)
              : v;
            const toResult = (r, arrayMode) => {
              const columns = r.columns.map(([name, typeOid]) => ({ name, typeOid }));
              const value = (v, c) =>
                v === null ? v
                : JSON_OIDS.includes(c.typeOid) ? JSON.parse(v)
                : typeof v === 'bigint' ? String(v)
                : v;
              const rows = r.rows.map((row) => arrayMode
                ? row.map((v, i) => value(v, columns[i]))
                : Object.fromEntries(columns.map((c, i) => [c.name, value(row[i], c)])));
              return { rows, rowCount: r.rowCount, columns };
            };
            export class SqlDatabase {
              #handle;
              constructor(handle) { this.#handle = handle; }
              static open(name) { return new SqlDatabase(call(() => raw.open(name))); }
              async query(sql, params = [], options = {}) {
                const r = call(() => raw.query(this.#handle, sql, params.map(param)));
                return toResult(r, options.rowMode === 'array');
              }
              async batch(statements, options = {}) {
                const rs = call(() => raw.batch(this.#handle,
                  statements.map((s) => [s.sql, (s.params ?? []).map(param)])));
                return rs.map((r) => toResult(r, options.rowMode === 'array'));
              }
            }
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
