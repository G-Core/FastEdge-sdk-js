import type { StaticAsset } from '../assets/static-assets.ts';

/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param request - The HTTP request object.
 * @returns An array of entity tags from the `If-None-Match` header.
 */
const getIfNoneMatchHeader = (request: Request): string[] =>
  (request.headers.get('If-None-Match') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => Boolean(x));

/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param etag - The entity tag to check.
 * @param headerValue - The array of entity tags from the `If-None-Match` header.
 * @returns `true` if the condition is met, otherwise `false`.
 */
const checkIfNoneMatch = (etag: string, headerValue: string[]): boolean => {
  // 1. If the field value is "*", the condition is false if the origin server has a
  // current representation for the target resource.
  if (headerValue.includes('*')) {
    return false;
  }

  // 2. If the field value is a list of entity tags, the condition is false if one of the listed tags matches the
  // entity tag of the selected representation. A recipient MUST use the weak comparison function when comparing
  // entity tags for If-None-Match (Section 8.8.3.2), since weak entity tags can be used for cache validation even
  // if there have been changes to the representation data.

  // But in our system we don't use weak tags, so we do a compare
  if (headerValue.includes(etag)) {
    return false;
  }

  // 3. Otherwise, the condition is true.
  return true;
};

/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param request - The HTTP request object.
 * @returns The parsed `If-Modified-Since` header value as a number of seconds, or `null` if invalid.
 */
const getIfModifiedSinceHeader = (request: Request): number | null => {
  // A recipient MUST ignore the If-Modified-Since header field if the received
  // field value is not a valid HTTP-date, the field value has more than one
  // member, or if the request method is neither GET nor HEAD.

  const headerValue = request.headers.get('If-Modified-Since');
  if (headerValue == null || headerValue === '') {
    return null;
  }
  const dateValueMs = Date.parse(headerValue);
  if (Number.isNaN(dateValueMs)) {
    // Date.parse returns NaN if the date cannot be parsed.
    return null;
  }
  // We want to return this as a number of seconds;
  return Math.floor(dateValueMs / 1000);
};

/**
 * https://httpwg.org/specs/rfc9110.html#field.if-modified-since
 * @param asset - The static asset to check.
 * @param ifModifiedSince - The `If-Modified-Since` header value as a number of seconds.
 * @returns `true` if the asset has been modified since the given time, otherwise `false`.
 */
const checkIfModifiedSince = (asset: StaticAsset, ifModifiedSince: number): boolean => {
  // 1. If the selected representation's last modification date is earlier or equal to the
  // date provided in the field value, the condition is false.
  if (asset.getMetadata().fileInfo.lastModifiedTime <= ifModifiedSince) {
    return false;
  }

  // 2. Otherwise, the condition is true.
  return true;
};

/**
 * Builds a subset of response headers based on the provided keys.
 *
 * @param responseHeaders - The full set of response headers.
 * @param keys - The keys to include in the subset.
 * @returns A subset of the response headers.
 */
const buildHeadersSubset = (
  responseHeaders: Record<string, string>,
  keys: Readonly<string[]>,
): Record<string, string> => {
  const resultHeaders: Record<string, string> = {};
  for (const value of keys) {
    if (value in responseHeaders) {
      resultHeaders[value] = responseHeaders[value];
    }
  }
  return resultHeaders;
};

export {
  buildHeadersSubset,
  checkIfModifiedSince,
  checkIfNoneMatch,
  getIfModifiedSinceHeader,
  getIfNoneMatchHeader,
};
