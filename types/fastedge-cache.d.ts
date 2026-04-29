declare module 'fastedge::cache' {
  /**
   * The FastEdge cache is a fast, data-center-scoped key/value store with
   * TTL and atomic counter primitives. It is intended for transient,
   * request-time state — rate limiting, hit counters, response memoisation,
   * deduplicated work — where speed and strong consistency within a single
   * point-of-presence matter more than global durability.
   *
   * **Consistency:** strongly consistent within a POP, independent across
   * POPs. A value written from one data center is not visible to another.
   * For globally-replicated, eventually-consistent storage use the
   * `fastedge::kv` module instead.
   *
   * **Storage:** values are stored as raw bytes. The cache does not record
   * what type the developer originally passed; on read, callers decode
   * using whichever `CacheEntry` accessor they need (`text`, `json`,
   * `arrayBuffer`).
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { Cache } from "fastedge::cache";
   *
   * async function app(event) {
   *   // Rate-limit by client IP — 100 requests per minute
   *   const ip = event.request.headers.get("x-forwarded-for") ?? "unknown";
   *   const count = Cache.incr(`rl:${ip}`);
   *   if (count === 1) Cache.expire(`rl:${ip}`, { ttl: 60 });
   *   if (count > 100) {
   *     return new Response("Too Many Requests", { status: 429 });
   *   }
   *
   *   // Memoise an expensive computation for 5 minutes
   *   const entry = await Cache.getOrSet("expensive-result", async () => ({
   *     value: JSON.stringify(await compute()),
   *     ttl: 300,
   *   }));
   *   return new Response(await entry.text(), {
   *     headers: { "content-type": "application/json" },
   *   });
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */

  /**
   * Values that can be written to the cache. All forms are coerced to
   * raw bytes before storage:
   *
   * - `string` — encoded as UTF-8.
   * - `ArrayBuffer` / `ArrayBufferView` — used directly.
   * - `ReadableStream` — fully consumed, then stored as a single byte buffer.
   * - `Response` — `await response.arrayBuffer()` is consumed; the response
   *   status and headers are discarded. The cache stores bytes only; if you
   *   need to round-trip status or headers, encode them into the value
   *   yourself (for example, as a JSON envelope).
   */
  export type CacheValue =
    | string
    | ArrayBuffer
    | ArrayBufferView
    | ReadableStream
    | Response;

  /**
   * Options controlling how long a cache entry lives.
   *
   * Pass exactly one of `ttl`, `ttlMs`, or `expiresAt`. Passing more than
   * one — or passing zero or negative values — throws `TypeError`. If the
   * options bag is omitted or empty, the entry has no expiry and persists
   * until explicitly deleted (subject to the host's eviction policy).
   *
   * - `ttl` — relative TTL, **seconds** from now. The conventional unit
   *   for cache and key/value APIs.
   * - `ttlMs` — relative TTL, **milliseconds** from now. Use when you need
   *   sub-second granularity (e.g. short rate-limit windows in tests).
   * - `expiresAt` — absolute expiry, **Unix epoch seconds**. Use for
   *   "expire at midnight" / fixed-deadline patterns.
   */
  export interface WriteOptions {
    /**
     * Relative TTL, in **seconds** from now.
     * Mutually exclusive with `ttlMs` and `expiresAt`.
     */
    ttl?: number;

    /**
     * Relative TTL, in **milliseconds** from now.
     * Mutually exclusive with `ttl` and `expiresAt`.
     */
    ttlMs?: number;

    /**
     * Absolute expiry as a **Unix epoch (seconds)**.
     * Mutually exclusive with `ttl` and `ttlMs`.
     */
    expiresAt?: number;
  }

  /**
   * A handle to a cached value. The bytes are already in memory by the
   * time you receive a `CacheEntry`; the body accessor methods are
   * Promise-returning to align with the standard Web `Body` interface,
   * but they resolve immediately.
   */
  export interface CacheEntry {
    /**
     * Read the entry as an `ArrayBuffer`.
     */
    arrayBuffer(): Promise<ArrayBuffer>;

    /**
     * Read the entry as a UTF-8 decoded string.
     */
    text(): Promise<string>;

    /**
     * Read the entry as parsed JSON. Rejects with a `SyntaxError` if the
     * bytes are not valid JSON.
     */
    json(): Promise<unknown>;
  }

  /**
   * Static interface to the FastEdge POP-local cache.
   *
   * All methods are static; `Cache` is never constructed. Reads, counter
   * operations, and metadata operations are synchronous; `set` is async
   * because it accepts body-like inputs (`Response`, `ReadableStream`)
   * that must be collected before the host call.
   *
   * Errors from the host (access denied, internal error, implementation-
   * specific I/O) surface as thrown `Error` objects with descriptive
   * messages. Wrap calls in `try`/`catch` if you need to handle them.
   */
  export class Cache {
    /**
     * Get the entry for `key`, or `null` if absent or expired.
     *
     * Synchronous. The bytes are returned by the host in a single call;
     * decode via the `CacheEntry` accessors.
     *
     * @example
     * ```js
     * const entry = Cache.get("user:42");
     * if (entry) {
     *   const user = await entry.json();
     *   // ...
     * }
     * ```
     */
    static get(key: string): CacheEntry | null;

    /**
     * Test whether `key` exists in the cache without transferring its value.
     *
     * Cheaper than `get` when you only need presence. Synchronous.
     */
    static exists(key: string): boolean;

    /**
     * Store `value` under `key`, optionally with an expiry.
     *
     * Returns a `Promise<void>` because `Response` and `ReadableStream`
     * inputs must be collected before the host call. The Promise resolves
     * once the value has been written.
     *
     * Overwrites any existing value at `key`. Pass an empty options bag —
     * or omit `options` — to store with no expiry.
     *
     * @example
     * ```js
     * await Cache.set("session:abc", JSON.stringify(session), { ttl: 600 });
     * await Cache.set("manifest", await fetch("/manifest.json"));
     * ```
     */
    static set(
      key: string,
      value: CacheValue,
      options?: WriteOptions,
    ): Promise<void>;

    /**
     * Remove `key` from the cache.
     *
     * Synchronous. A no-op if the key does not exist.
     */
    static delete(key: string): void;

    /**
     * Update the expiry of an existing key.
     *
     * Returns `true` if the expiry was set, `false` if the key does not
     * exist. Synchronous.
     *
     * @example
     * ```js
     * Cache.expire("rl:1.2.3.4", { ttl: 60 });
     * ```
     */
    static expire(key: string, options: WriteOptions): boolean;

    /**
     * Atomically increment the integer at `key` by `delta` (default 1).
     *
     * If the key does not exist, it is initialised to `0` before
     * incrementing. Returns the new value. Synchronous.
     *
     * `delta` may be negative; for readability prefer `Cache.decr` in
     * that case. Throws if the stored value at `key` is not an integer.
     *
     * @example
     * ```js
     * // Per-IP request counter, reset every minute
     * const count = Cache.incr(`rl:${ip}`);
     * if (count === 1) Cache.expire(`rl:${ip}`, { ttl: 60 });
     * ```
     */
    static incr(key: string, delta?: number): number;

    /**
     * Atomically decrement the integer at `key` by `delta` (default 1).
     *
     * Sugar for `incr(key, -(delta ?? 1))`. Returns the new value.
     * Synchronous.
     */
    static decr(key: string, delta?: number): number;

    /**
     * Get the entry for `key`, or run `populate` and cache its result.
     *
     * On a cache miss, `populate` is invoked once and the resolved value
     * is stored under `key` with the supplied `options`. Concurrent callers
     * for the same key in the same WASM instance share one `populate`
     * execution; the inserter is not re-run for joiners.
     *
     * **Coalescing scope:** in-process only. Concurrent requests handled
     * by other WASM instances — including other workers in the same POP —
     * race independently and may each run `populate`. For a POP-local
     * cache this is the honest guarantee.
     *
     * **Errors:** if `populate` throws or its Promise rejects, the
     * rejection propagates to all current waiters. The next call after
     * the rejection retries `populate` (no negative caching).
     *
     * @example
     * ```js
     * // Simple origin proxy with a 5-second cache
     * const entry = await Cache.getOrSet(
     *   request.url,
     *   () => fetch(`origin-url/${request.path}`),
     *   { ttl: 5 },
     * );
     * return new Response(await entry.arrayBuffer());
     * ```
     */
    static getOrSet(
      key: string,
      populate: () => CacheValue | Promise<CacheValue>,
      options?: WriteOptions,
    ): Promise<CacheEntry>;
  }
}
