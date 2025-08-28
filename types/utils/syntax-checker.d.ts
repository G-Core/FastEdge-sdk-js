/**
 * Checks if the given file contains syntax errors.
 * @param jsInput - The path to the file.
 * @param tsconfigPath - The path to the TypeScript configuration file (optional).
 * @returns `true` if the file contains syntax errors, otherwise `false`.
 */
declare function containsSyntaxErrors(jsInput: string, tsconfigPath?: string): boolean;
export { containsSyntaxErrors };
