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
   *     const value = kv.get("key");
   *
   *     return new Response(value, {
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

  export interface KvStoreInstance {
    /**
     * Retrieves the value associated with the given key from the KV store.
     *
     * @param {string} key  The key to retrieve the value for.
     *
     * @returns {ArrayBuffer | null} The value associated with the key, or null if not found.
     */
    get(key: string): ArrayBuffer | null;

    /**
     * Retrieves all key prefix matches from the KV store.
     *
     * @param {string} pattern  The prefix pattern to match keys against. e.g. 'foo*' ( Must include wildcard )
     *
     * @returns {Array<string>} The keys matching the pattern, or empty array if none found.
     */
    scan(pattern: string): Array<string>;

    /**
     * Retrieves all the values between the given range from the KV stores ZSet.
     *
     * @param {string} key  The key for the Sorted Set.
     * @param {number} min  The minimum value for the range.
     * @param {number} max  The maximum value for the range.
     *
     * @returns {Array<ArrayBuffer>} The values within range for the key, or an empty array if none found.
     */
    zrange(key: string, min: number, max: number): Array<ArrayBuffer>;

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
