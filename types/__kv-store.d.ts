/**
 * FastEdge KvStore interface for persistent key-value storage operations.
 */
declare class GENERATED_KvStore {
  // NOT SURE WHERE THIS FILE COMES FROM>> LLM??
  /**
   * Opens a key-value store with the specified name.
   *
   * @param name - The name of the store to open
   * @returns A KvStore instance
   * @throws Error if the store doesn't exist, access is denied, or other errors occur
   */
  static open(name: string): KvStore;

  /**
   * Gets the value associated with the specified key.
   *
   * @param key - The key to look up
   * @returns A Uint8Array containing the value, or null if the key doesn't exist
   * @throws Error if the operation fails
   */
  get(key: string): Uint8Array | null;

  /**
   * Scans for keys matching a glob-style pattern.
   *
   * @param pattern - A glob-style pattern to match keys against
   * @returns An array of matching key strings
   * @throws Error if the operation fails
   */
  scan(pattern: string): string[];

  /**
   * Gets values from a sorted set within a score range.
   *
   * @param key - The key of the sorted set
   * @param min - Minimum score (inclusive)
   * @param max - Maximum score (inclusive)
   * @returns An array of Uint8Arrays containing the values
   * @throws Error if the operation fails
   */
  zrange(key: string, min: number, max: number): Uint8Array[];

  /**
   * Scans through a sorted set by key with pattern matching.
   *
   * @param key - The key of the sorted set
   * @param pattern - A glob-style pattern to match against
   * @returns An array of tuples containing [value, score]
   * @throws Error if the operation fails
   */
  zscan(key: string, pattern: string): [Uint8Array, number][];

  /**
   * Checks if an item exists in a Bloom filter.
   *
   * @param key - The key of the Bloom filter
   * @param item - The item to check for
   * @returns true if the item probably exists, false if it definitely doesn't exist
   * @throws Error if the operation fails
   */
  bfExists(key: string, item: string): boolean;
}

/**
 * Helper class for text-based key-value operations.
 * Provides convenience methods for working with string values.
 */
declare class TextKvStore {
  /**
   * Creates a new TextKvStore instance.
   *
   * @param storeName - The name of the store to open
   */
  constructor(storeName: string);

  /**
   * Gets a string value for the specified key.
   *
   * @param key - The key to look up
   * @returns The string value, or null if the key doesn't exist
   */
  getString(key: string): string | null;

  /**
   * Gets the underlying KvStore instance.
   */
  readonly store: KvStore;
}
