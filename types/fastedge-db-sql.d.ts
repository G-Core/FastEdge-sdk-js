declare module 'fastedge::db/sql' {
  /**
   * A parameter for a `$1`, `$2`, ... placeholder.
   *
   * - `bigint` is sent as `int8`, `Uint8Array` as `bytea`.
   * - `Date` is sent as ISO-8601 text, any other object as JSON text.
   * - Everything else is sent as text and cast by PostgreSQL.
   */
  export type SqlParam = null | undefined | boolean | number | bigint | string | Uint8Array | Date | object;

  /**
   * A result value.
   *
   * | PostgreSQL | JS |
   * |---|---|
   * | `int2`, `int4`, `float4`, `float8` | `number` |
   * | `int8`, `numeric` | `string` (no precision loss) |
   * | `bool` | `boolean` |
   * | `json`, `jsonb` | parsed value |
   * | `bytea` | `Uint8Array` |
   * | `timestamptz` | `string`, PostgreSQL text format in UTC |
   * | anything else (dates, uuid, arrays, ...) | `string`, PostgreSQL text format |
   * | `NULL` | `null` |
   */
  export type SqlValue = null | boolean | number | string | Uint8Array | unknown;

  export interface SqlColumn {
    /** Column name or alias. */
    name: string;
    /** PostgreSQL type OID (e.g. 23 = int4, 1184 = timestamptz). */
    typeOid: number;
  }

  export interface SqlResult<T = Record<string, SqlValue>> {
    /** Rows keyed by column name, or arrays in column order with `rowMode: 'array'`. */
    rows: T[];
    /** Rows returned (SELECT) or affected (INSERT/UPDATE/DELETE). */
    rowCount: number;
    columns: SqlColumn[];
  }

  export interface SqlStatement {
    sql: string;
    params?: SqlParam[];
  }

  export interface SqlQueryOptions {
    /** `'array'` returns each row as an array in column order. Default: objects. */
    rowMode?: 'object' | 'array';
  }

  export type SqlErrorKind =
    /** Unknown binding, bad credentials or database name. */
    | 'config'
    | 'access-denied'
    /** The database could not be reached. */
    | 'connection'
    /** The call exceeded the host's time limit; the statement may or may not have been applied. */
    | 'timeout'
    /** A host or backend limit was exceeded (response size, statements per batch, sub-requests). */
    | 'limit'
    /** The database rejected the statement; see `code`. */
    | 'query'
    | 'internal';

  /** Error from the database or the host. Thrown by `open`, rejected by `query` and `batch`. */
  export class SqlError extends Error {
    readonly name: 'SqlError';
    readonly kind: SqlErrorKind;
    /** PostgreSQL SQLSTATE, e.g. `'23505'` unique_violation. Set for most `query` errors. */
    readonly code?: string;
    readonly detail?: string;
    readonly hint?: string;
    /** Name of the violated constraint, for constraint errors. */
    readonly constraint?: string;
  }

  /**
   * A SQL database (PostgreSQL) bound to your application by name. The connection details stay
   * with the host; the app only knows the binding name.
   *
   * `query` and `batch` start at once and run concurrently with each other and with `fetch`, so
   * `Promise.all` of several queries takes about one round trip. Calls you have not awaited may
   * run in any order: await a write before relying on it, and use `batch` for ordered or atomic
   * work.
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { SqlDatabase, SqlError } from "fastedge::db/sql";
   *
   * async function app(event) {
   *   const db = SqlDatabase.open("main");
   *   try {
   *     const { rows } = await db.query("select id, email from users where id = $1", [42]);
   *     return Response.json(rows[0] ?? null);
   *   } catch (error) {
   *     if (error instanceof SqlError && error.code === "42P01") {
   *       return new Response("Table missing", { status: 500 });
   *     }
   *     throw error;
   *   }
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */
  export class SqlDatabase {
    /**
     * Open the database bound to `name`.
     *
     * @throws {SqlError} `kind: 'config'` if no database is bound to `name`.
     */
    static open(name: string): SqlDatabase;

    /**
     * Run one statement with positional parameters (`$1`, `$2`, ...). Auto-commits.
     * `T` is not checked at runtime.
     */
    query<T = Record<string, SqlValue>>(
      sql: string,
      params?: SqlParam[],
      options?: SqlQueryOptions,
    ): Promise<SqlResult<T>>;

    /**
     * Run several statements in one transaction: all commit or none do. Returns one result per
     * statement, in order.
     */
    batch(statements: SqlStatement[], options?: SqlQueryOptions): Promise<SqlResult[]>;
  }
}
