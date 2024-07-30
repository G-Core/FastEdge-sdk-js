declare module 'fastedge::fs' {
  /**
   * Function to read a file at a given path synchronously.
   * Used for embedding file contents into the wasm binary.
   *
   * **Note**: This can only be invoked during build-time initialization.
   *
   * @param {string} path The path to the file
   * @returns {Uint8Array} Byte array of the file contents
   *
   */
  export function readFileSync(path: string): Uint8Array;
}
