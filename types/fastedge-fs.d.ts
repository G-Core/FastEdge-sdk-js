declare module 'feastedge::fs' {
  /**
   * Function to read a file at a given path synchronously.
   * Used for embedding file contents into the wasm binary.
   *
   * **Note**: This can only be invoked during build-time initialization.
   *
   * @param path The path to the file
   *
   */
  export function readFileSync(path: string): Uint8Array;
}
