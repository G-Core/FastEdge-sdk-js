export type BuildConfig = {
    input: string;
    output: string;
    publicDir: string;
    ignoreDotFiles: boolean;
    ignoreDirs: string[];
    ignoreWellKnown: boolean;
};
export type ServerConfig = {
    extendedCache: Array<string | RegExp>;
    publicDirPrefix: string;
    compression: Array<string>;
    notFoundPage: string | null;
    autoExt: Array<string>;
    autoIndex: Array<string>;
    spaEntrypoint: string | null;
};
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
export function normalizeBuildConfig(config?: Object): BuildConfig;
/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.)
 * @param {string} path
 * @param {string} prefix - Prefix to add to the normalized value.
 * @returns {string}
 */
export function normalizePath(path?: string, prefix?: string): string;
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
export function normalizeServerConfig(config?: Object): ServerConfig;
