import { normalizeServerConfig } from '../utils/config-helpers.ts';
import {
  buildHeadersSubset,
  checkIfModifiedSince,
  checkIfNoneMatch,
  getIfModifiedSinceHeader,
  getIfNoneMatchHeader,
} from './utils/headers.ts';
import type { StaticAsset } from './assets/static-assets.ts';
import type { AssetCache } from './assets/asset-cache.ts';

/**
 * Represents the type of headers.
 */
type HeadersType = Record<string, string>;

/**
 * Represents the supported content compression types.
 */
type ContentCompressionTypes = 'br' | 'gzip';

/**
 * Represents the initialization options for an asset.
 */
interface AssetInit {
  status?: number;
  headers?: HeadersType;
  cache?: 'extended' | 'never' | null;
}

/**
 * Represents the configuration for the static server.
 */
interface ServerConfig {
  spaEntrypoint: string | null;
  notFoundPage: string | null;
  publicDirPrefix: string;
  extendedCache: Array<string | RegExp>;
  autoIndex: Array<string>;
  autoExt: Array<string>;
  compression: Array<ContentCompressionTypes>;
}

/**
 * Represents the static server.
 */
interface StaticServer {
  getMatchingAsset(path: string): StaticAsset | null;
  findAcceptEncodings(request: Request): Array<ContentCompressionTypes>;
  testExtendedCache(pathname: string): boolean;
  handlePreconditions(
    request: Request,
    asset: StaticAsset,
    responseHeaders: HeadersType,
  ): Response | null;
  serveAsset(request: Request, asset: StaticAsset, init?: AssetInit): Promise<Response>;
  serveRequest(request: Request): Promise<Response | null>;
}

// Headers to preserve for 304 responses
const headersToPreserveFor304 = ['Content-Location', 'ETag', 'Vary', 'Cache-Control', 'Expires'];

/**
 * Checks if the request accepts `text/html`.
 *
 * @param req - The HTTP request.
 * @returns `true` if the request accepts `text/html`, otherwise `false`.
 */
function requestAcceptsTextHtml(req: Request): boolean {
  const accept = new Set((req.headers.get('Accept') ?? '').split(',').map((x) => x.split(';')[0]));
  return accept.has('text/html') || accept.has('*/*') || accept.has('*');
}

/**
 * Handles HTTP preconditions for a request.
 *
 * @param request - The HTTP request.
 * @param asset - The static asset.
 * @param responseHeaders - The response headers.
 * @returns A `Response` object if a precondition fails, otherwise `null`.
 */
const handlePreconditions = (
  request: Request,
  asset: StaticAsset,
  responseHeaders: HeadersType,
): Response | null => {
  // Handle preconditions according to https://httpwg.org/specs/rfc9110.html#rfc.section.13.2.2

  // A recipient cache or origin server MUST evaluate the request preconditions defined by this specification in the following order:
  // 1. When recipient is the origin server and If-Match is present, evaluate the If-Match precondition:
  // - if true, continue to step 3
  // - if false, respond 412 (Precondition Failed) unless it can be determined that the state-changing request has already succeeded (see Section 13.1.1)

  // 2. When recipient is the origin server, If-Match is not present, and If-Unmodified-Since is present, evaluate the If-Unmodified-Since precondition:
  // - if true, continue to step 3
  // - if false, respond 412 (Precondition Failed) unless it can be determined that the state-changing request has already succeeded (see Section 13.1.4)

  // 3. When If-None-Match is present, evaluate the If-None-Match precondition:
  // - if true, continue to step 5
  // - if false for GET/HEAD, respond 304 (Not Modified)
  // - if false for other methods, respond 412 (Precondition Failed)

  let skipIfNoneMatch = false;
  {
    const headerValue = getIfNoneMatchHeader(request);
    if (headerValue.length > 0) {
      const result = checkIfNoneMatch(responseHeaders.ETag, headerValue);
      if (result) {
        skipIfNoneMatch = true;
      } else {
        return new Response(null, {
          status: 304,
          headers: buildHeadersSubset(responseHeaders, headersToPreserveFor304),
        });
      }
    }
  }

  // 4. When the method is GET or HEAD, If-None-Match is not present, and If-Modified-Since is present, evaluate the
  // If-Modified-Since precondition:
  // - if true, continue to step 5
  // - if false, respond 304 (Not Modified)

  if (!skipIfNoneMatch) {
    // For us, method is always GET or HEAD here.
    const headerValue = getIfModifiedSinceHeader(request);
    if (headerValue != null) {
      const result = checkIfModifiedSince(asset, headerValue);
      if (!result) {
        return new Response(null, {
          status: 304,
          headers: buildHeadersSubset(responseHeaders, headersToPreserveFor304),
        });
      }
    }
  }

  // 5. When the method is GET and both Range and If-Range are present, evaluate the If-Range precondition:
  // - if true and the Range is applicable to the selected representation, respond 206 (Partial Content)
  // - otherwise, ignore the Range header field and respond 200 (OK)

  // 6. Otherwise,
  // - perform the requested method and respond according to its success or failure.
  return null;
};

/**
 * Creates a static server instance, able to serve static assets.
 *
 * @param serverConfig - The server configuration.
 * @param assetCache - The asset cache.
 * @returns A `StaticServer` instance.
 */
const getStaticServer = (
  serverConfig: ServerConfig,
  assetCache: AssetCache<StaticAsset>,
): StaticServer => {
  const _serverConfig = normalizeServerConfig(serverConfig);
  const _assetCache = assetCache; // @ts-ignore
  const _extendedCache = serverConfig.extendedCache;

  /**
   * Fing the matching asset.
   *
   * @param path - path of the asset.
   * @returns A `StaticAsset`
   */
  const getMatchingAsset = (path: string): StaticAsset | null => {
    // @ts-ignore
    const assetKey = _serverConfig.publicDirPrefix + path;

    if (!assetKey.endsWith('/')) {
      // A path that does not end in a slash can match an asset directly
      const asset = _assetCache.getAsset(assetKey);
      if (asset != null) {
        return asset;
      }

      // ... or, we can try auto-ext:
      // looks for an asset that has the specified suffix (usually extension, such as .html)
      for (const extEntry of _serverConfig.autoExt) {
        const assetKeyWithExt = assetKey + extEntry;
        const asset = _assetCache.getAsset(assetKeyWithExt);
        if (asset != null) {
          return asset;
        }
      }
    }

    if (_serverConfig.autoIndex.length > 0) {
      // Try auto-index:
      // treats the path as a directory, and looks for an asset with the specified
      // suffix (usually an index file, such as index.html)
      let assetNameAsDir = assetKey;
      // Remove all slashes from end, and add one trailing slash
      while (assetNameAsDir.endsWith('/')) {
        assetNameAsDir = assetNameAsDir.slice(0, -1);
      }
      assetNameAsDir += '/';
      for (const indexEntry of _serverConfig.autoIndex) {
        const assetKeyIndex = assetNameAsDir + indexEntry;
        const asset = _assetCache.getAsset(assetKeyIndex);
        if (asset != null) {
          return asset;
        }
      }
    }
    return null;
  };

  const findAcceptEncodings = (request: Request): Array<ContentCompressionTypes> => {
    if (_serverConfig.compression.length === 0) {
      return [];
    }
    const found = (request.headers.get('accept-encoding') ?? '')
      .split(',')
      .map((x) => {
        // eslint-disable-next-line prefer-const
        let [encodingValue, qValueStr] = x.trim().split(';');
        let qValue; // Multiply q value by 1000
        if (qValueStr == null || !qValueStr.startsWith('q=')) {
          // Use default of 1.0
          qValue = 1000;
        } else {
          qValueStr = qValueStr.slice(2); // Remove the q=
          qValue = Number.parseFloat(qValueStr);
          if (Number.isNaN(qValue) || qValue > 1) {
            qValue = 1;
          }
          if (qValue < 0) {
            qValue = 0;
          }
          // Remove precision: q values can have up to 3 decimal digits
          qValue = Math.floor(qValue * 1000);
        }
        return [encodingValue.trim(), qValue] as [ContentCompressionTypes, number];
      })
      .filter(([encoding]) => _serverConfig.compression.includes(encoding));

    const priorityMap = new Map();
    for (const [encoding, qValue] of found) {
      let typesForQValue = priorityMap.get(qValue);
      if (typesForQValue == null) {
        typesForQValue = [];
        priorityMap.set(qValue, typesForQValue);
      }
      typesForQValue.push(encoding);
    }

    // Sort keys, larger numbers to come first
    // @ts-ignore
    const keysSorted = [...priorityMap.keys()].sort((qValueA, qValueB) => qValueB - qValueA);

    return keysSorted.map((qValue) => priorityMap.get(qValue));
  };

  const testExtendedCache = (pathname: string): boolean =>
    _extendedCache.some((x) => {
      if (x instanceof RegExp) {
        return x.test(pathname);
      }
      if (x.endsWith('/')) {
        return pathname.startsWith(x);
      }
      return x === pathname;
    });

  const serveAsset = async (
    request: Request,
    asset: StaticAsset,
    init?: AssetInit,
  ): Promise<Response> => {
    const metadata = asset.getMetadata();
    const headers: HeadersType = {
      'Content-Type': metadata.contentType,
    };
    Object.assign(headers, init?.headers);
    if (init?.cache != null) {
      let cacheControlValue;
      switch (init.cache) {
        case 'extended':
          cacheControlValue = 'max-age=31536000';
          break;
        case 'never':
          cacheControlValue = 'no-store';
          break;
        default:
          cacheControlValue = null;
      }
      if (cacheControlValue !== null) {
        headers['Cache-Control'] = cacheControlValue;
      }
    }

    const acceptEncodings = findAcceptEncodings(request);
    const storeEntry = await asset.getStoreEntry(acceptEncodings);
    const contentEncoding = storeEntry.contentEncoding();
    if (contentEncoding != null) {
      headers['Content-Encoding'] = contentEncoding;
    }

    headers.ETag = `"${storeEntry.hash()}"`;
    if (metadata.fileInfo.lastModifiedTime !== 0) {
      headers['Last-Modified'] = new Date(metadata.fileInfo.lastModifiedTime * 1000).toUTCString();
    }

    const preconditionResponse = handlePreconditions(request, asset, headers);
    if (preconditionResponse != null) {
      return preconditionResponse;
    }

    return new Response(storeEntry.body(), {
      status: init?.status ?? 200,
      headers,
    });
  };

  const serveRequest = async (request: Request): Promise<Response | null> => {
    // Only handle GET and HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return null;
    }

    const url = new URL(request.url);
    const { pathname } = url;

    const asset = getMatchingAsset(pathname);
    if (asset != null) {
      return serveAsset(request, asset, {
        cache: testExtendedCache(pathname) ? 'extended' : null,
      });
    }

    // Fallback HTML responses, like SPA and "not found" pages
    if (requestAcceptsTextHtml(request)) {
      // These are raw asset paths, not relative to public path
      const { spaEntrypoint } = _serverConfig;
      if (spaEntrypoint != null) {
        const asset = _assetCache.getAsset(spaEntrypoint);
        if (asset != null) {
          return serveAsset(request, asset, {
            cache: 'never',
          });
        }
      }

      const { notFoundPage } = _serverConfig;
      if (notFoundPage != null) {
        const asset = _assetCache.getAsset(notFoundPage);
        if (asset != null) {
          return serveAsset(request, asset, {
            status: 404,
            cache: 'never',
          });
        }
      }
    }

    return null;
  };

  return {
    findAcceptEncodings,
    getMatchingAsset,
    handlePreconditions,
    serveAsset,
    serveRequest,
    testExtendedCache,
  };
};

export { getStaticServer };
export { createStaticAssetsCache } from './assets/static-assets.ts';

export type { StaticAssetManifest } from './assets/static-assets.ts';
export type {
  AssetCache,
  AssetInit,
  ContentCompressionTypes,
  HeadersType,
  ServerConfig,
  StaticServer,
};
