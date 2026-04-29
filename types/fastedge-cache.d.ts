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
   *   const count = await Cache.incr(`rl:${ip}`);
   *   if (count === 1) await Cache.expire(`rl:${ip}`, { ttl: 60 });
   *   if (count > 100) {
   *     return new Response("Too Many Requests", { status: 429 });
   *   }
   *
   *   // Memoise an expensive computation for 5 minutes
   *   const entry = await Cache.getOrSet(
   *     "expensive-result",
   *     async () => JSON.stringify(await compute()),
   *     { ttl: 300 },
   *   );
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
   * All methods are static; `Cache` is never constructed. Every method
   * returns a `Promise` so the API stays stable as the underlying host
   * interface evolves: the cache is sync today (using the `cache-sync`
   * WIT) and will become async once the toolchain supports the async
   * `cache` WIT — application code keeps working unchanged either way.
   *
   * Operational errors from the host (access denied, internal error,
   * implementation-specific I/O) surface as Promise rejections.
   * Validation errors on call arguments (wrong types, conflicting
   * `WriteOptions` fields) are thrown synchronously; both forms are
   * caught the same way by `try`/`catch` around an `await`.
   */
  export class Cache {
    /**
     * Get the entry for `key`, or `null` if absent or expired.
     *
     * @example
     * ```js
     * const entry = await Cache.get("user:42");
     * if (entry) {
     *   const user = await entry.json();
     *   // ...
     * }
     * ```
     */
    static get(key: string): Promise<CacheEntry | null>;

    /**
     * Test whether `key` exists in the cache without transferring its value.
     *
     * Cheaper than `get` when you only need presence.
     */
    static exists(key: string): Promise<boolean>;

    /**
     * Store `value` under `key`, optionally with an expiry.
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
     * A no-op if the key does not exist.
     */
    static delete(key: string): Promise<void>;

    /**
     * Update the expiry of an existing key.
     *
     * Resolves to `true` if the expiry was set, `false` if the key does
     * not exist.
     *
     * @example
     * ```js
     * await Cache.expire("rl:1.2.3.4", { ttl: 60 });
     * ```
     */
    static expire(key: string, options: WriteOptions): Promise<boolean>;

    /**
     * Atomically increment the integer at `key` by `delta` (default 1).
     *
     * If the key does not exist, it is initialised to `0` before
     * incrementing. Resolves to the new value.
     *
     * `delta` may be negative; for readability prefer `Cache.decr` in
     * that case. Rejects if the stored value at `key` is not an integer.
     *
     * Note on precision: integer values larger than
     * `Number.MAX_SAFE_INTEGER` (2^53 − 1) are not represented exactly.
     * This is unreachable for typical counter use cases.
     *
     * @example
     * ```js
     * // Per-IP request counter, reset every minute
     * const count = await Cache.incr(`rl:${ip}`);
     * if (count === 1) await Cache.expire(`rl:${ip}`, { ttl: 60 });
     * ```
     */
    static incr(key: string, delta?: number): Promise<number>;

    /**
     * Atomically decrement the integer at `key` by `delta` (default 1).
     *
     * Sugar for `incr(key, -(delta ?? 1))`. Resolves to the new value.
     */
    static decr(key: string, delta?: number): Promise<number>;

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
