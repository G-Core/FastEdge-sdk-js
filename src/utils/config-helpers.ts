/**
 * Removes the './' prefix from a given string.
 * @param str - The string to process.
 * @returns The string without the './' prefix.
 */
const removeDotSlashPrefix = (str: string = ''): string => str.replace(/^\.\//u, '');

/**
 * Removes trailing slashes from a given string.
 * @param str - The string to process.
 * @returns The string without trailing slashes.
 */
const removeTrailingSlash = (str: string = ''): string => str.replace(/\/+$/u, '');

/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.) This will be used for asset keys and URL paths.
 * @param path - The path to normalize.
 * @returns The normalized path.
 */
function normalizePath(path: string = ''): string {
  if (path === '.' || path === '/' || path === '\\') {
    return '/';
  }
  let normalizedPath = removeDotSlashPrefix(path);
  normalizedPath = removeTrailingSlash(normalizedPath);
  // Add a preceding slash if it does not exist
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  return normalizedPath;
}

/**
 * Default boolean creation function. Either the current value or the default value.
 * @param defaultValue - The default value.
 * @returns A function that returns the boolean value or the default value.
 */
function defaultedBoolean(defaultValue: boolean): (value?: boolean) => boolean {
  return (value?: boolean): boolean => value ?? defaultValue;
}

/**
 * Normalize a string value or return null if not set.
 * @param value - The value to normalize.
 * @returns The normalized string or null.
 */
function normalizeString(value?: string | null): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return '';
}

/**
 * Ensure there is always a string array.
 * @param arr - The array to normalize.
 * @returns The normalized array.
 */
function normalizeStringArray(arr: Array<string> = []): Array<string> {
  return arr.map(normalizeString);
}

/**
 * Normalize path on an array of string paths.
 * @param pathsArray - The array of paths to normalize.
 * @returns The normalized array of paths.
 */
function normalizeArrayOfPaths(pathsArray: Array<string> = []): Array<string> {
  return pathsArray.map((p) => normalizePath(p));
}

/**
 * Checks if a string is a valid regex pattern.
 * @param pattern - The regex pattern to validate.
 * @returns `true` if the pattern is valid, otherwise `false`.
 */
function isValidRegex(pattern: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern, 'u');
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a string to a regex if possible, otherwise returns the string.
 * @param pattern - The string to convert.
 * @returns A regex or the original string.
 */
function convertToRegex(pattern: string): string | RegExp {
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 2) {
    const regex = pattern.slice(1, pattern.lastIndexOf('/'));
    const flags = pattern.slice(pattern.lastIndexOf('/') + 1);
    if (isValidRegex(regex)) {
      return new RegExp(regex, flags);
    }
  }
  return pattern;
}

/**
 * Normalize path or convert to regex from string array.
 * @param inputsArray - The array of inputs to normalize.
 * @returns The normalized array of paths or regexes.
 */
function normalizePathsOrRegex(inputsArray: string[] = []): Array<string | RegExp> {
  return inputsArray
    .map((strInput) => {
      if (strInput.startsWith('regex:')) {
        const regexp = convertToRegex(strInput.slice(6));
        if (typeof regexp === 'string') {
          // eslint-disable-next-line no-console
          console.warn('caution', `Invalid regex pattern: ${strInput}`);
          return '';
        }
        return regexp;
      }
      return normalizePath(strInput);
    })
    .filter((item): item is string | RegExp => Boolean(item));
}

const normalizeFns = {
  booleanTruthy: defaultedBoolean(true),
  booleanFalsy: defaultedBoolean(false),
  path: normalizePath,
  pathsArray: normalizeArrayOfPaths,
  pathsOrRegexArray: normalizePathsOrRegex,
  string: normalizeString,
  stringArray: normalizeStringArray,
};

/**
 * Normalizes a configuration object using provided normalization functions.
 * @template T
 * @param config - The configuration object to normalize.
 * @param normalizeFns - The normalization functions.
 * @returns The normalized configuration object.
 */
function normalizeConfig<T extends Record<string, unknown>>(
  config: Partial<T>,
  normalize: Record<keyof T, keyof typeof normalizeFns>,
): T {
  const result = { ...config } as T;
  // Only normalize keys that are explicitly configured
  // eslint-disable-next-line unicorn/no-array-for-each
  (Object.keys(normalize) as Array<keyof T>).forEach((key) => {
    const normalizeFnKey = normalize[key];
    const normalizeFn = normalizeFns[normalizeFnKey];
    if (normalizeFn) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input = (config[key] ?? undefined) as any;
      result[key] = normalizeFn(input) as T[keyof T];
    }
  });

  return result;
}

export { normalizeConfig, normalizePath };
