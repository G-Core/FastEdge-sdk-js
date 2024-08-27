/**
 * Removes the './' prefix from a given string.
 * @param {string} str - The string to process.
 * @returns {string} The string without the './' prefix.
 */
const removeDotSlashPrefix = (str) => str.replace(/^\.\//u, '');

/**
 * Removes trailing slashes from a given string.
 * @param {string} str - The string to process.
 * @returns {string} The string without trailing slashes.
 */
const removeTrailingSlash = (str) => str.replace(/\/+$/u, '');

/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.)
 * @param {string} path
 * @param {string} prefix - Prefix to add to the normalized value.
 * @returns {string}
 */
function normalizePath(path = '', prefix = '') {
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
 * @param {boolean} defaultValue
 * @returns {(value?: boolean) => boolean}
 */
function defaultedBoolean(defaultValue) {
  return (value) => value ?? defaultValue;
}

/**
 * Normalize a string value or return null if not set.
 * @param {boolean} normalizeValue
 * @param {string} prefix - Prefix to add to the normalized value.
 * @returns {(value?: string | null) => string | null}
 */
function normalizeString(normalizeValue = true, prefix = '') {
  return (value) => {
    if (typeof value === 'string' && value.length > 0) {
      return normalizeValue ? normalizePath(value, prefix) : value;
    }
    return null;
  };
}

/**
 * Ensure there is always a string array.
 * @param {Array<string>} arr
 * @returns {Array<string>}
 */
function normalizeStringArray(arr = []) {
  return arr;
}

/**
 * Normalize path on an array of string paths.
 * @param {Array<string>} pathsArray
 * @returns {Array<string>}
 */
function normalizeArrayOfPaths(pathsArray = []) {
  return pathsArray.map((p) => normalizePath(p));
}

/**
 * @param {string} pattern
 * @returns {boolean}
 */
function isValidRegex(pattern) {
  try {
    // eslint-disable-next-line require-unicode-regexp, no-new
    new RegExp(pattern);
    return true;
    // eslint-disable-next-line unicorn/prefer-optional-catch-binding
  } catch (error) {
    return false;
  }
}

/**
 * @param {string} pattern
 * @returns {string | RegExp}
 */
function convertToRegex(pattern) {
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 2) {
    // Implies string may be a regex. e.g. /hello/gi
    const regex = pattern.slice(1, pattern.lastIndexOf('/'));
    const flags = pattern.slice(pattern.lastIndexOf('/') + 1);
    if (isValidRegex(regex)) {
      return new RegExp(regex, flags);
    }
  }
  // Not a valid regex, return as string
  return pattern;
}

/**
 * Normalize path or convert to regex from string array
 * @param {Array<string>} inputsArray
 * @returns {Array<string | RegExp>}
 */
function normalizePathsOrRegex(inputsArray = []) {
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
 * @typedef {Object} BuildConfig
 * @property {string} input
 * @property {string} output
 * @property {string} publicDir
 * @property {boolean} ignoreDotFiles
 * @property {string[]} ignoreDirs
 * @property {boolean} ignoreWellKnown
 */

/**
 * @param {Object} config
 * @returns {BuildConfig}
 */
function normalizeBuildConfig(config = {}) {
  /**
   * @type {Object.<string, function>} buildConfigNormalizeFns
   * @property {function(boolean): boolean} ignoreDotFiles
   * @property {function(boolean): boolean} ignoreWellKnown
   * @property {function(Array<string>): Array<string>} ignoreDirs
   */
  const buildConfigNormalizeFns = {
    ignoreDotFiles: defaultedBoolean(true),
    ignoreWellKnown: defaultedBoolean(false),
    ignoreDirs: normalizeArrayOfPaths,
  };
  return normalizeConfig(config, buildConfigNormalizeFns);
}

/**
 * @typedef {Object} ServerConfig
 * @property {Array<string | RegExp>} extendedCache
 * @property {string} publicDirPrefix
 * @property {Array<string>} compression
 * @property {string | null} notFoundPage
 * @property {Array<string>} autoExt
 * @property {Array<string>} autoIndex
 * @property {string | null} spaEntrypoint
 */

/**
 * @param {Object} config
 * @returns {ServerConfig}
 */
function normalizeServerConfig(config = {}) {
  /**
   * @type {Object.<string, function>} serverConfigNormalizeFns
   * @property {function(Array<string>): Array<string | RegExp>} extendedCache
   * @property {function(Array<string>): Array<string>} compression
   * @property {function(string | null): string | null} notFoundPage
   * @property {function(Array<string>): Array<string>} autoExt
   * @property {function(Array<string>): Array<string>} autoIndex
   * @property {function(string | null): string | null} spaEntrypoint
   */
  const serverConfigNormalizeFns = {
    extendedCache: normalizePathsOrRegex,
    compression: normalizeStringArray,
    notFoundPage: normalizeString(),
    autoExt: normalizeStringArray,
    autoIndex: normalizeStringArray,
    spaEntrypoint: normalizeString(),
  };
  return normalizeConfig(config, serverConfigNormalizeFns);
}

/**
 * Normalize config object.
 * @template T
 * @param {Object} config
 * @param {Object.<string, function>} normalizeFns
 * @returns {T}
 */
function normalizeConfig(config, normalizeFns) {
  return Object.entries(config).reduce((acc, [key, value]) => {
    const normalizeFn = normalizeFns[key];
    return {
      ...acc,
      [key]: normalizeFn ? normalizeFn(value) : value,
    };
  }, /** @type {T} */ ({}));
}

export { normalizeBuildConfig, normalizePath, normalizeServerConfig };
