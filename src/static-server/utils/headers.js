/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param {Request} request
 * @returns {Array<string>}
 */
const getIfNoneMatchHeader = (request) =>
  (request.headers.get('If-None-Match') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => Boolean(x));

/**
 * https://httpwg.org/specs/rfc9110.html#field.if-none-match
 * @param {string} etag
 * @param {Array<string>} headerValue
 * @returns {boolean}
 */
const checkIfNoneMatch = (etag, headerValue) => {
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
 * @param {Request} request
 * @returns {number | null}
 */
const getIfModifiedSinceHeader = (request) => {
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
 * @param {import('../types/').StaticAsset} asset
 * @param {number} ifModifiedSince
 * @returns {boolean}
 */
const checkIfModifiedSince = (asset, ifModifiedSince) => {
  // 1. If the selected representation's last modification date is earlier or equal to the
  // date provided in the field value, the condition is false.
  if (asset.getMetadata().lastModifiedTime <= ifModifiedSince) {
    return false;
  }

  // 2. Otherwise, the condition is true.
  return true;
};

/**
 * @param {Record<string, string>} responseHeaders
 * @param {Readonly<string[]>} keys
 * @returns {Record<string, string>}
 */
const buildHeadersSubset = (responseHeaders, keys) => {
  /**
   * @type {Record<string, string>}
   */
  const resultHeaders = {};
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
