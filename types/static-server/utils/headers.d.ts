import type { StaticAsset } from '../assets/static-assets.ts';
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param request - The HTTP request object.
 * @returns An array of entity tags from the `If-None-Match` header.
 */
declare const getIfNoneMatchHeader: (request: Request) => string[];
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param etag - The entity tag to check.
 * @param headerValue - The array of entity tags from the `If-None-Match` header.
 * @returns `true` if the condition is met, otherwise `false`.
 */
declare const checkIfNoneMatch: (etag: string, headerValue: string[]) => boolean;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param request - The HTTP request object.
 * @returns The parsed `If-Modified-Since` header value as a number of seconds, or `null` if invalid.
 */
declare const getIfModifiedSinceHeader: (request: Request) => number | null;
/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param asset - The static asset to check.
 * @param ifModifiedSince - The `If-Modified-Since` header value as a number of seconds.
 * @returns `true` if the asset has been modified since the given time, otherwise `false`.
 */
declare const checkIfModifiedSince: (asset: StaticAsset, ifModifiedSince: number) => boolean;
/**
 * Builds a subset of response headers based on the provided keys.
 *
 * @param responseHeaders - The full set of response headers.
 * @param keys - The keys to include in the subset.
 * @returns A subset of the response headers.
 */
declare const buildHeadersSubset: (responseHeaders: Record<string, string>, keys: Readonly<string[]>) => Record<string, string>;
export { buildHeadersSubset, checkIfModifiedSince, checkIfNoneMatch, getIfModifiedSinceHeader, getIfNoneMatchHeader, };
