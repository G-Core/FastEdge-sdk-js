/**
 * Removes the './' prefix from a given string.
 * @param str - The string to process.
 * @returns The string without the './' prefix.
 */
const removeDotSlashPrefix = (str: string): string => str.replace(/^\.\//u, '');

/**
 * Removes trailing slashes from a given string.
 * @param str - The string to process.
 * @returns The string without trailing slashes.
 */
const removeTrailingSlash = (str: string): string => str.replace(/\/+$/u, '');

/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.)
 * @param path - The path to normalize.
 * @param prefix - Prefix to add to the normalized value.
 * @returns The normalized path.
 */
function normalizePath(path: string = '', prefix: string = ''): string {
  let normalizedPath = removeDotSlashPrefix(path);
  normalizedPath = removeTrailingSlash(normalizedPath);
  // Add a preceding slash if it does not exist
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  return `${prefix}${normalizedPath}`;
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
 * @param normalizeValue - Whether to normalize the value.
 * @param prefix - Prefix to add to the normalized value.
 * @returns A function that normalizes the string or returns null.
 */
function normalizeString(
  normalizeValue: boolean = true,
  prefix: string = '',
): (value?: string | null) => string | null {
  return (value?: string | null): string | null => {
    if (typeof value === 'string' && value.length > 0) {
      return normalizeValue ? normalizePath(value, prefix) : value;
    }
    return null;
  };
}

/**
 * Ensure there is always a string array.
 * @param arr - The array to normalize.
 * @returns The normalized array.
 */
function normalizeStringArray(arr: Array<string> = []): Array<string> {
  return arr;
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
    .filter(Boolean);
}

/**
 * Normalizes a configuration object using provided normalization functions.
 * @template T
 * @param config - The configuration object to normalize.
 * @param normalizeFns - The normalization functions.
 * @returns The normalized configuration object.
 */
function normalizeConfig<T>(
  config: Partial<T>,
  normalizeFns: Record<string, (value: unknown) => unknown>,
): T {
  return Object.entries(config).reduce((acc, [key, value]) => {
    const normalizeFn = normalizeFns[key];
    return {
      ...acc,
      [key]: normalizeFn ? normalizeFn(value) : value,
    };
  }, {} as T);
}

/**
 * Build configuration interface.
 */
interface BuildConfig {
  input: string;
  output: string;
  publicDir: string;
  ignoreDotFiles: boolean;
  ignoreDirs: string[];
  ignoreWellKnown: boolean;
}

/**
 * Normalizes the build configuration object.
 * @param config - The configuration object to normalize.
 * @returns The normalized build configuration.
 */
function normalizeBuildConfig(config: Partial<BuildConfig> = {}): BuildConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildConfigNormalizeFns: Record<string, (value: any) => any> = {
    ignoreDotFiles: defaultedBoolean(true),
    ignoreWellKnown: defaultedBoolean(false),
    ignoreDirs: normalizeArrayOfPaths,
  };
  return normalizeConfig<BuildConfig>(config, buildConfigNormalizeFns);
}

/**
 * Server configuration interface.
 */
interface ServerConfig {
  extendedCache: Array<string | RegExp>;
  publicDirPrefix: string;
  compression: string[];
  notFoundPage: string | null;
  autoExt: string[];
  autoIndex: string[];
  spaEntrypoint: string | null;
}

/**
 * Normalizes the server configuration object.
 * @param config - The configuration object to normalize.
 * @returns The normalized server configuration.
 */
function normalizeServerConfig(config: Partial<ServerConfig> = {}): ServerConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverConfigNormalizeFns: Record<string, (value: any) => any> = {
    extendedCache: normalizePathsOrRegex,
    compression: normalizeStringArray,
    notFoundPage: normalizeString(),
    autoExt: normalizeStringArray,
    autoIndex: normalizeStringArray,
    spaEntrypoint: normalizeString(),
  };
  return normalizeConfig<ServerConfig>(config, serverConfigNormalizeFns);
}

export { normalizeBuildConfig, normalizePath, normalizeServerConfig };
export type { BuildConfig, ServerConfig };
