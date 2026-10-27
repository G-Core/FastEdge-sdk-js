declare module 'fastedge::db/kv' {
  /**
   * A value to store. Strings are stored as UTF-8. Values must be valid UTF-8 for now: other bytes
   * are rejected with `KvError` `kind: 'limit'`.
   */
  export type KvValue = string | ArrayBuffer | ArrayBufferView;

  /**
   * Expiry, as for `Cache`: pass at most one of `ttl` (seconds), `ttlMs` (milliseconds) or
   * `expiresAt` (Unix epoch seconds).
   */
  export interface KvExpiry {
    ttl?: number;
    ttlMs?: number;
    expiresAt?: number;
  }

  /** Options for `set`. Without an expiry the key never expires; any earlier expiry is removed. */
  export interface KvSetOptions extends KvExpiry {
    /** Write only if the key does not exist. */
    ifNotExists?: boolean;
    /** Write only if the key exists. */
    ifExists?: boolean;
  }

  /** A stored value, as returned by `get`. Same shape as `CacheEntry` from `fastedge::cache`. */
  export interface KvEntry {
    arrayBuffer(): Promise<ArrayBuffer>;
    /** The value decoded as UTF-8. */
    text(): Promise<string>;
    /** The value parsed as JSON; rejects with a `SyntaxError` if it isn't JSON. */
    json(): Promise<unknown>;
  }

  /** One operation of a `batch`. Same semantics as the method of the same name. */
  export type KvOp =
    | { op: 'get'; key: string }
    | { op: 'exists'; key: string }
    | { op: 'set'; key: string; value: KvValue; options?: KvSetOptions }
    | { op: 'delete'; key: string }
    | { op: 'incr'; key: string; delta?: number }
    | { op: 'expire'; key: string; options: KvExpiry };

  /**
   * Result of one batch operation, in order: `get` → `KvEntry | null`, `incr` → `number`,
   * `exists` / `set` / `delete` / `expire` → `boolean`.
   */
  export type KvOpResult = KvEntry | null | number | boolean;

  export type KvErrorKind =
    /** Unknown binding, or the binding is misconfigured (e.g. bad credentials). */
    | 'config'
    | 'access-denied'
    /** The database could not be reached. */
    | 'connection'
    /** The call exceeded the host's time limit; the operation may or may not have been applied. */
    | 'timeout'
    /** A host or backend limit was exceeded (value size, operations per batch, calls per request). */
    | 'limit'
    /** An operation failed, e.g. `incr` on a value that isn't an integer; see `code`, `opIndex`. */
    | 'operation'
    | 'internal';

  /** Error from the database or the host. Thrown by `open`, rejected by the other methods. */
  export class KvError extends Error {
    readonly name: 'KvError';
    readonly kind: KvErrorKind;
    /** Backend error code, e.g. `'ERR'`, `'WRONGTYPE'`, for `kind: 'operation'`. */
    readonly code?: string;
    /** Index of the failing operation, for a `batch`. */
    readonly opIndex?: number;
  }

  /**
   * Database KV bound to your application by name: regional, durable and writable from the app.
   * Not to be confused with Edge Storage (`fastedge::kv`, read-only, replicated to every edge) or
   * the POP-local `Cache`. The connection details stay with the host; the app only knows the
   * binding name.
   *
   * Every call is a round trip to the database.
   *
   * Within one request, reads see the request's own writes. Other requests may see a write only
   * after it has replicated (eventually, for a database with read replicas in other regions).
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { KvDatabase } from "fastedge::db/kv";
   *
   * async function app(event) {
   *   const db = KvDatabase.open("main");
   *   const visits = await db.incr("visits");
   *   await db.set("last-visit", new Date().toISOString(), { ttl: 3600 });
   *   return Response.json({ visits });
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */
  export class KvDatabase {
    /**
     * Open the database bound to `name`.
     *
     * @throws {KvError} `kind: 'config'` if no database is bound to `name`.
     */
    static open(name: string): KvDatabase;

    /** The value of `key`, or `null` if it doesn't exist or has expired. */
    get(key: string): Promise<KvEntry | null>;

    /** Whether `key` exists (and hasn't expired), without fetching its value. */
    exists(key: string): Promise<boolean>;

    /** Set `key`. Resolves to `false` if `ifNotExists` / `ifExists` wasn't met, else `true`. */
    set(key: string, value: KvValue, options?: KvSetOptions): Promise<boolean>;

    /** Delete `key`. Resolves to `true` if it existed. */
    delete(key: string): Promise<boolean>;

    /**
     * Add `delta` (default 1, may be negative) to the integer at `key`; a missing key counts as 0.
     * Keeps the key's expiry. Resolves to the new value. Integers beyond
     * `Number.MAX_SAFE_INTEGER` are not exact.
     */
    incr(key: string, delta?: number): Promise<number>;

    /** Set the expiry of `key`. Resolves to `false` if it doesn't exist. */
    expire(key: string, options: KvExpiry): Promise<boolean>;

    /**
     * Run several operations atomically: all are applied or none are, and no other client sees a
     * partial batch. Each operation sees the effects of earlier ones. An unmet `set` condition
     * isn't a failure (its result is `false`); any other failing operation rejects the whole batch
     * with `KvError` `kind: 'operation'` and `opIndex`.
     *
     * @example
     * ```js
     * // Count a request in a 60 s window that starts at the first request.
     * const [, count] = await db.batch([
     *   { op: "set", key: `rl:${ip}`, value: "0", options: { ttl: 60, ifNotExists: true } },
     *   { op: "incr", key: `rl:${ip}` },
     * ]);
     * ```
     */
    batch(ops: KvOp[]): Promise<KvOpResult[]>;
  }
}
