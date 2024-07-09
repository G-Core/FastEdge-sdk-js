// src/static-server/utils/headers.js
var getIfNoneMatchHeader = (request) =>
  (request.headers.get('If-None-Match') ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => Boolean(x));
var checkIfNoneMatch = (etag, headerValue) => {
  if (headerValue.includes('*')) {
    return false;
  }
  if (headerValue.includes(etag)) {
    return false;
  }
  return true;
};
var getIfModifiedSinceHeader = (request) => {
  const headerValue = request.headers.get('If-Modified-Since');
  if (headerValue == null || headerValue === '') {
    return null;
  }
  const dateValueMs = Date.parse(headerValue);
  if (Number.isNaN(dateValueMs)) {
    return null;
  }
  return Math.floor(dateValueMs / 1e3);
};
var checkIfModifiedSince = (asset, ifModifiedSince) => {
  if (asset.getMetadata().lastModifiedTime <= ifModifiedSince) {
    return false;
  }
  return true;
};
var buildHeadersSubset = (responseHeaders, keys) => {
  const resultHeaders = {};
  for (const value of keys) {
    if (value in responseHeaders) {
      resultHeaders[value] = responseHeaders[value];
    }
  }
  return resultHeaders;
};

// src/static-server/index.js
var headersToPreserveForUnmodified = [
  'Content-Location',
  'ETag',
  'Vary',
  'Cache-Control',
  'Expires',
];
function requestAcceptsTextHtml(req) {
  const accept = new Set((req.headers.get('Accept') ?? '').split(',').map((x) => x.split(';')[0]));
  if (!accept.has('text/html') && !accept.has('*/*') && accept.has('*')) {
    return false;
  }
  return true;
}
var handlePreconditions = (request, asset, responseHeaders) => {
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
          headers: buildHeadersSubset(responseHeaders, headersToPreserveForUnmodified),
        });
      }
    }
  }
  if (!skipIfNoneMatch) {
    const headerValue = getIfModifiedSinceHeader(request);
    if (headerValue != null) {
      const result = checkIfModifiedSince(asset, headerValue);
      if (!result) {
        return new Response(null, {
          status: 304,
          headers: buildHeadersSubset(responseHeaders, headersToPreserveForUnmodified),
        });
      }
    }
  }
  return null;
};
var getStaticServer = (serverConfig, assetCache) => {
  const _serverConfig = serverConfig;
  const _assetCache = assetCache;
  const _staticItems = serverConfig.staticItems
    .map((x, i) => {
      if (x.startsWith('re:')) {
        const fragments = x.slice(3).match(/\/(.*?)\/([a-z]*)?$/i);
        if (fragments == null) {
          console.warn(`Cannot parse staticItems item index ${i}: '${x}', skipping...`);
          return '';
        }
        return new RegExp(fragments[1], fragments[2] || '');
      }
      return x;
    })
    .filter((x) => Boolean(x));
  const getMatchingAsset = (path) => {
    const assetKey = _serverConfig.publicDirPrefix + path;
    if (!assetKey.endsWith('/')) {
      const asset = _assetCache.getAsset(assetKey);
      if (asset != null) {
        return asset;
      }
      for (const extEntry of _serverConfig.autoExt) {
        const assetKeyWithExt = assetKey + extEntry;
        const asset2 = _assetCache.getAsset(assetKeyWithExt);
        if (asset2 != null) {
          return asset2;
        }
      }
    }
    if (_serverConfig.autoIndex.length > 0) {
      let assetNameAsDir = assetKey;
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
  const findAcceptEncodings = (request) => {
    if (_serverConfig.compression.length === 0) {
      return [];
    }
    const found = (request.headers.get('accept-encoding') ?? '')
      .split(',')
      .map((x) => {
        let [encodingValue, qValueStr] = x.trim().split(';');
        let qValue;
        if (qValueStr == null || !qValueStr.startsWith('q=')) {
          qValue = 1e3;
        } else {
          qValueStr = qValueStr.slice(2);
          qValue = Number.parseFloat(qValueStr);
          if (Number.isNaN(qValue) || qValue > 1) {
            qValue = 1;
          }
          if (qValue < 0) {
            qValue = 0;
          }
          qValue = Math.floor(qValue * 1e3);
        }
        return [encodingValue.trim(), qValue];
      })
      .filter(([encoding]) => _serverConfig.compression.includes(encoding));
    const priorityMap = /* @__PURE__ */ new Map();
    for (const [encoding, qValue] of found) {
      let typesForQValue = priorityMap.get(qValue);
      if (typesForQValue == null) {
        typesForQValue = [];
        priorityMap.set(qValue, typesForQValue);
      }
      typesForQValue.push(encoding);
    }
    const keysSorted = [...priorityMap.keys()].sort((qValueA, qValueB) => qValueB - qValueA);
    return keysSorted.map((qValue) => priorityMap.get(qValue));
  };
  const testExtendedCache = (pathname) =>
    _staticItems.some((x) => {
      if (x instanceof RegExp) {
        return x.test(pathname);
      }
      if (x.endsWith('/')) {
        return pathname.startsWith(x);
      }
      return x === pathname;
    });
  const serveAsset = async (request, asset, init) => {
    const metadata = asset.getMetadata();
    const headers = {
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
    if (storeEntry.contentEncoding() != null) {
      headers['Content-Encoding'] = storeEntry.contentEncoding();
    }
    headers.ETag = `"${storeEntry.hash()}"`;
    if (metadata.lastModifiedTime !== 0) {
      headers['Last-Modified'] = new Date(metadata.lastModifiedTime * 1e3).toUTCString();
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
  const serveRequest = async (request) => {
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
    if (requestAcceptsTextHtml(request)) {
      const { spaFile } = _serverConfig;
      if (spaFile != null) {
        const asset2 = _assetCache.getAsset(spaFile);
        if (asset2 != null) {
          return serveAsset(request, asset2, {
            cache: 'never',
          });
        }
      }
      const { notFoundPageFile } = _serverConfig;
      if (notFoundPageFile != null) {
        const asset2 = _assetCache.getAsset(notFoundPageFile);
        if (asset2 != null) {
          return serveAsset(request, asset2, {
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
