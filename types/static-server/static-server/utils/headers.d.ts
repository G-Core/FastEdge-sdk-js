/**
 * @param {Record<string, string>} responseHeaders
 * @param {Readonly<string[]>} keys
 * @returns {Record<string, string>}
 */
export function buildHeadersSubset(responseHeaders: Record<string, string>, keys: Readonly<string[]>): Record<string, string>;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param {import('../assets/static-assets.js').StaticAsset} asset
 * @param {number} ifModifiedSince
 * @returns {boolean}
 */
export function checkIfModifiedSince(asset: import("../assets/static-assets.js").StaticAsset, ifModifiedSince: number): boolean;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param {string} etag
 * @param {Array<string>} headerValue
 * @returns {boolean}
 */
export function checkIfNoneMatch(etag: string, headerValue: Array<string>): boolean;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param {Request} request
 * @returns {number | null}
 */
export function getIfModifiedSinceHeader(request: Request): number | null;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param {Request} request
 * @returns {Array<string>}
 */
export function getIfNoneMatchHeader(request: Request): Array<string>;
