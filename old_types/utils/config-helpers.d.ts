/**
 * Takes a path string and ensures it has no trailing slash and has a single preceding slash.
 * (No dot-slash prefix allowed.)
 * @param path - The path to normalize.
 * @param prefix - Prefix to add to the normalized value.
 * @returns The normalized path.
 */
declare function normalizePath(path?: string, prefix?: string): string;
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
declare function normalizeBuildConfig(config?: Partial<BuildConfig>): BuildConfig;
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
declare function normalizeServerConfig(config?: Partial<ServerConfig>): ServerConfig;
export { normalizeBuildConfig, normalizePath, normalizeServerConfig };
export type { BuildConfig, ServerConfig };
