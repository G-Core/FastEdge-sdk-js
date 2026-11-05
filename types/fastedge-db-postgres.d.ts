declare module 'fastedge::db/postgres' {
  import type {
    SqlColumn,
    SqlErrorKind,
    SqlJson,
    SqlParam,
    SqlQueryOptions,
    SqlResult,
    SqlStatement,
    SqlValue,
  } from 'fastedge::db/sql';

  /**
   * A parameter for a `$1`, `$2`, ... placeholder.
   *
   * - `bigint` is sent as `int8`, `Uint8Array` as `bytea`.
   * - `Date` is sent as ISO-8601 text, any other object as JSON text.
   * - Everything else is sent as text and cast by PostgreSQL.
   */
  export type PostgresParam = SqlParam;

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
   * | anything else (dates, uuid, arrays, enums, ...) | `string`, PostgreSQL text format |
   * | `NULL` | `null` |
   *
   * Extension and user-defined types (pgvector `vector`, PostGIS `geometry`, enums, domains) work
   * as text: send them as text parameters, casting in SQL where PostgreSQL cannot infer the type
   * (e.g. `order by embedding <-> $1::vector`), and they come back as a `string` in PostgreSQL's
   * text format (`"[0.1,0.2]"` for a vector).
   */
  export type PostgresValue = SqlValue;
  /** A parsed `json` / `jsonb` value. */
  export type PostgresJson = SqlJson;
  /**
   * A result column. `typeName` is PostgreSQL's name for a built-in type (e.g. `'int4'`,
   * `'timestamptz'`, `'int4[]'`); it is empty for extension and user-defined types (pgvector
   * `vector`, PostGIS `geometry`, enums, domains).
   */
  export type PostgresColumn = SqlColumn;
  export type PostgresResult<T = Record<string, PostgresValue>> = SqlResult<T>;
  export type PostgresStatement = SqlStatement;
  export type PostgresQueryOptions = SqlQueryOptions;
  export type PostgresErrorKind = SqlErrorKind;

  /**
   * SQLSTATE codes apps commonly branch on (PostgreSQL `errcodes.txt`). Any other code still
   * arrives in `PostgresError.code`.
   */
  export const SQLSTATE: {
    /** `23505`: a unique constraint or index rejected a duplicate. */
    readonly UNIQUE_VIOLATION: '23505';
    /** `23503`: a foreign key points at a missing row. */
    readonly FOREIGN_KEY_VIOLATION: '23503';
    /** `23502`: `NULL` in a `NOT NULL` column. */
    readonly NOT_NULL_VIOLATION: '23502';
    /** `23514`: a `CHECK` constraint failed. */
    readonly CHECK_VIOLATION: '23514';
    /** `23P01`: an exclusion constraint failed. */
    readonly EXCLUSION_VIOLATION: '23P01';
    /** `22P02`: text could not be parsed as the column type (e.g. `'abc'` for an integer). */
    readonly INVALID_TEXT_REPRESENTATION: '22P02';
    /** `22003`: a number out of the column type's range. */
    readonly NUMERIC_VALUE_OUT_OF_RANGE: '22003';
    /** `22001`: a string longer than the column allows. */
    readonly STRING_DATA_RIGHT_TRUNCATION: '22001';
    /** `22012`: division by zero. */
    readonly DIVISION_BY_ZERO: '22012';
    /** `42P01`: the table does not exist (e.g. migrations not applied). */
    readonly UNDEFINED_TABLE: '42P01';
    /** `42703`: the column does not exist. */
    readonly UNDEFINED_COLUMN: '42703';
    /** `42883`: no function matches the name and argument types. */
    readonly UNDEFINED_FUNCTION: '42883';
    /** `42601`: SQL syntax error (e.g. `?` placeholders instead of `$1`). */
    readonly SYNTAX_ERROR: '42601';
    /** `42501`: the database role lacks a privilege. */
    readonly INSUFFICIENT_PRIVILEGE: '42501';
    /** `40001`: serialization failure; the transaction may be retried. */
    readonly SERIALIZATION_FAILURE: '40001';
    /** `40P01`: deadlock detected; the transaction may be retried. */
    readonly DEADLOCK_DETECTED: '40P01';
    /** `57014`: the statement was cancelled (e.g. `statement_timeout`). */
    readonly QUERY_CANCELED: '57014';
    /** `28P01`: wrong password for the database role (`kind: 'config'`). */
    readonly INVALID_PASSWORD: '28P01';
    /** `3D000`: the database does not exist (`kind: 'config'`). */
    readonly INVALID_CATALOG_NAME: '3D000';
  };

  /** A SQLSTATE listed in {@link SQLSTATE}. */
  export type PostgresSqlState = (typeof SQLSTATE)[keyof typeof SQLSTATE];

  /**
   * Error from the database or the host. Thrown by `open`, rejected by `query` and `batch`.
   *
   * The same class as `SqlError` from `fastedge::db/sql` (`name` is `'SqlError'`), so
   * `instanceof` matches either.
   */
  export class PostgresError extends Error {
    readonly name: 'SqlError';
    readonly kind: PostgresErrorKind;
    /** The SQLSTATE (compare with {@link SQLSTATE}). Set for most `query` errors. */
    readonly code?: PostgresSqlState | (string & {});
    readonly detail?: string;
    readonly hint?: string;
    /** Name of the violated constraint, for constraint errors. */
    readonly constraint?: string;
  }

  /**
   * A PostgreSQL database bound to your application by name: the `fastedge::db/sql` API under
   * PostgreSQL names. Write PostgreSQL (`$1` placeholders, `RETURNING`, `jsonb`). The host does
   * not check the dialect: bind a PostgreSQL database (e.g. Neon) to the name. The connection
   * details stay with the host; the app only knows the binding name.
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
   * import { PostgresDatabase, PostgresError, SQLSTATE } from "fastedge::db/postgres";
   *
   * async function app(event) {
   *   const db = PostgresDatabase.open("main");
   *   try {
   *     await db.query("insert into users (email) values ($1)", ["ann@example.com"]);
   *     return new Response("Created", { status: 201 });
   *   } catch (error) {
   *     if (error instanceof PostgresError && error.code === SQLSTATE.UNIQUE_VIOLATION) {
   *       return new Response("Already registered", { status: 409 });
   *     }
   *     throw error;
   *   }
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */
  export class PostgresDatabase {
    /**
     * Open the database bound to `name`.
     *
     * @throws {PostgresError} `kind: 'config'` if no database is bound to `name`.
     */
    static open(name: string): PostgresDatabase;

    /**
     * Run one statement with positional parameters (`$1`, `$2`, ...). Auto-commits.
     * `T` is not checked at runtime.
     */
    query<T = Record<string, PostgresValue>>(
      sql: string,
      params?: PostgresParam[],
      options?: PostgresQueryOptions,
    ): Promise<PostgresResult<T>>;

    /**
     * Run several statements in one transaction: all commit or none do. Returns one result per
     * statement, in order.
     */
    batch(
      statements: PostgresStatement[],
      options?: PostgresQueryOptions,
    ): Promise<PostgresResult[]>;
  }
}
