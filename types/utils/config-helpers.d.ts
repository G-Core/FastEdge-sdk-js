/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.) This will be used for asset keys and URL paths.
 * @param path - The path to normalize.
 * @returns The normalized path.
 */
declare function normalizePath(path?: string): string;
/**
 * Normalize a string value or return null if not set.
 * @param value - The value to normalize.
 * @returns The normalized string or null.
 */
declare function normalizeString(value?: string | null): string;
/**
 * Ensure there is always a string array.
 * @param arr - The array to normalize.
 * @returns The normalized array.
 */
declare function normalizeStringArray(arr?: Array<string>): Array<string>;
/**
 * Ensure there is always an array, keeping its entries as they are (e.g. objects).
 * @param arr - The array to normalize.
 * @returns The array, or an empty array if not set.
 */
declare function normalizeArray<T>(arr?: T[] | null): T[];
/**
 * Normalize path on an array of string paths.
 * @param pathsArray - The array of paths to normalize.
 * @returns The normalized array of paths.
 */
declare function normalizeArrayOfPaths(pathsArray?: Array<string>): Array<string>;
/**
 * Normalize path or convert to regex from an array of strings and RegExps.
 * RegExp entries pass through. A trailing `/` is kept, so the entry still matches as a prefix.
 * @param inputsArray - The array of inputs to normalize.
 * @returns The normalized array of paths or regexes.
 */
declare function normalizePathsOrRegex(inputsArray?: Array<string | RegExp>): Array<string | RegExp>;
declare const normalizeFns: {
    array: typeof normalizeArray;
    booleanTruthy: (value?: boolean) => boolean;
    booleanFalsy: (value?: boolean) => boolean;
    path: typeof normalizePath;
    pathsArray: typeof normalizeArrayOfPaths;
    pathsOrRegexArray: typeof normalizePathsOrRegex;
    string: typeof normalizeString;
    stringArray: typeof normalizeStringArray;
};
/**
 * Normalizes a configuration object using provided normalization functions.
 * @template T
 * @param config - The configuration object to normalize.
 * @param normalizeFns - The normalization functions.
 * @returns The normalized configuration object.
 */
declare function normalizeConfig<T extends Record<string, unknown>>(config: Partial<T>, normalize: Record<keyof T, keyof typeof normalizeFns>): T;
export { normalizeConfig, normalizePath };
