declare module 'fastedge::kv' {
  /**
   * KvStore class to interact with the FastEdge Key-Value store.
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { KvStore } from "fastedge::kv";
   *
   * async function app(event) {
   *   try {
   *     const kv = KvStore.open("my-kv-store");
   *     const entry = await kv.getEntry("key");
   *
   *     if (entry === null) {
   *       return new Response("Not found", { status: 404 });
   *     }
   *
   *     return new Response(await entry.text(), {
   *       status: 200
   *     });
   *
   *   } catch (error) {
   *     return new Response("Error opening store", {
   *       status: 500
   *     });
   *   }
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */

  export class KvStore {
    /**
     * Static method to open a store and return an instance
     *
     * @param {string} name  The name of the KV store as defined on your application.
     *
     * @returns {KvStoreInstance} The KvStore instance for the opened store.
     */
    static open(name: string): KvStoreInstance;
  }

  /**
   * A handle to a value retrieved from the KV store. The bytes are
   * already in memory by the time you receive a `KvStoreEntry`; the body
   * accessor methods are Promise-returning to align with the standard
   * Web `Body` interface, but they resolve immediately.
   */
  export interface KvStoreEntry {
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

  export interface KvStoreInstance {
    /**
     * Retrieves the value associated with the given key from the KV store.
     *
     * @param {string} key  The key to retrieve the value for.
     *
     * @returns {ArrayBuffer | null} The value associated with the key, or null if not found.
     *
     * @see {@link KvStoreInstance.getEntry} for an entry-style API with `text()` / `json()` helpers.
     */
    get(key: string): ArrayBuffer | null;

    /**
     * Retrieves the value associated with the given key as a `KvStoreEntry`
     * with `text()` / `json()` / `arrayBuffer()` accessors.
     *
     * Use this when you want to decode the value as a string or JSON
     * without manual `TextDecoder` work.
     *
     * @param {string} key  The key to retrieve the value for.
     *
     * @returns {Promise<KvStoreEntry | null>} A `KvStoreEntry` for the
     *   value, or `null` if the key is not present.
     *
     * @example
     * ```js
     * const entry = await kv.getEntry("user:42");
     * if (entry) {
     *   const user = await entry.json();
     * }
     * ```
     */
    getEntry(key: string): Promise<KvStoreEntry | null>;

    /**
     * Retrieves all key prefix matches from the KV store.
     *
     * @param {string} pattern  The prefix pattern to match keys against. e.g. 'foo*' ( Must include wildcard )
     *
     * @returns {Array<string>} The keys matching the pattern, or empty array if none found.
     */
    scan(pattern: string): Array<string>;

    /**
     * Retrieves all the values from ZSet with scores between the given range.
     *
     * @param {string} key  The key for the Sorted Set.
     * @param {number} min  The minimum score for the range.
     * @param {number} max  The maximum score for the range.
     *
     * @returns {Array<[ArrayBuffer, number]>} Array of [value, score] tuples within range for the key, or an empty array if none found.
     *
     * @see {@link KvStoreInstance.zrangeByScoreEntries} for an entry-style API with `text()` / `json()` helpers.
     */
    zrangeByScore(key: string, min: number, max: number): Array<[ArrayBuffer, number]>;

    /**
     * Retrieves all values from a Sorted Set with scores between the given
     * range, returned as `KvStoreEntry` wrappers.
     *
     * Equivalent to `zrangeByScore(key, min, max)` but each tuple's value
     * is a `KvStoreEntry` instead of a raw `ArrayBuffer`.
     *
     * @param {string} key  The key for the Sorted Set.
     * @param {number} min  The minimum score for the range.
     * @param {number} max  The maximum score for the range.
     *
     * @returns {Promise<Array<[KvStoreEntry, number]>>} Array of
     *   [entry, score] tuples within range, or an empty array if none found.
     */
    zrangeByScoreEntries(
      key: string,
      min: number,
      max: number,
    ): Promise<Array<[KvStoreEntry, number]>>;

    /**
     * Retrieves all value prefix matches from the KV ZSet.
     *
     * @param {string} key  The key for the Sorted Set.
     * @param {string} pattern  The prefix pattern to match values against. e.g. 'foo*' ( Must include wildcard )
     *
     * @returns {Array<[ArrayBuffer, number]>} Array of [value, score] tuples which match the prefix pattern, or an empty array if none found.
     *
     * @see {@link KvStoreInstance.zscanEntries} for an entry-style API with `text()` / `json()` helpers.
     */
    zscan(key: string, pattern: string): Array<[ArrayBuffer, number]>;

    /**
     * Retrieves all value prefix matches from the KV Sorted Set, returned
     * as `KvStoreEntry` wrappers.
     *
     * Equivalent to `zscan(key, pattern)` but each tuple's value is a
     * `KvStoreEntry` instead of a raw `ArrayBuffer`.
     *
     * @param {string} key      The key for the Sorted Set.
     * @param {string} pattern  The prefix pattern to match values against.
     *                          e.g. 'foo*' (must include wildcard).
     *
     * @returns {Promise<Array<[KvStoreEntry, number]>>} Array of
     *   [entry, score] tuples matching the prefix, or an empty array if
     *   none found.
     */
    zscanEntries(
      key: string,
      pattern: string,
    ): Promise<Array<[KvStoreEntry, number]>>;

    /**
     * Checks if a given value exists within the KV stores Bloom Filter.
     *
     * @param {string} key  The key for the Bloom Filter.
     * @param {string} value  The value to check for existence.
     *
     * @returns {boolean} True if the value exists, false otherwise.
     */
    bfExists(key: string, value: string): boolean;
  }
}
