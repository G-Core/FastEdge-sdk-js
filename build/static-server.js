// src/static-server/utils/headers.js
var getIfNoneMatchHeader = (request) => {
  var _a;
  return ((_a = request.headers.get("If-None-Match")) != null ? _a : "").split(",").map((x) => x.trim()).filter((x) => Boolean(x));
};
var checkIfNoneMatch = (etag, headerValue) => {
  if (headerValue.includes("*")) {
    return false;
  }
  if (headerValue.includes(etag)) {
    return false;
  }
  return true;
};
var getIfModifiedSinceHeader = (request) => {
  const headerValue = request.headers.get("If-Modified-Since");
  if (headerValue == null || headerValue === "") {
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

// src/static-server/assets/asset-cache.js
var createAssetCache = (assets = {}) => {
  const _assets = assets;
  return {
    loadAsset: (assetKey, asset) => {
      _assets[assetKey] = asset;
    },
    getAsset: (assetKey) => {
      var _a;
      return (_a = _assets[assetKey]) != null ? _a : null;
    },
    getAssetKeys: () => Object.keys(_assets)
  };
};

// src/static-server/assets/asset-loader.js
import { readFileSync } from "fastedge::fs";

// src/static-server/assets/embedded-store-entry.js
var decoder = new TextDecoder();
var createReadableStreamForBytes = (array) => {
  let _disturbed = false;
  const underlyingSource = {
    async start(controller) {
      controller.enqueue(array);
      controller.close();
    }
  };
  const readableStream = new ReadableStream(underlyingSource);
  const getReader = () => {
    const reader = readableStream.getReader();
    const _read = reader.read;
    reader.read = async () => {
      const result = await _read.call(reader);
      if (result.done) {
        _disturbed = true;
      }
      return result;
    };
    const _cancel = reader.cancel;
    reader.cancel = async (reason) => {
      await _cancel.call(reader, reason);
      _disturbed = true;
    };
    return reader;
  };
  return Object.assign(readableStream, {
    getReader,
    isLocked: () => readableStream.locked,
    isDisturbed: () => _disturbed
  });
};
var createEmbeddedStoreEntry = (array, contentEncoding, hash, size) => {
  let _consumed = false;
  const _contentEncoding = contentEncoding;
  const _hash = hash;
  const _size = size;
  const _body = createReadableStreamForBytes(array);
  const arrayBuffer = async () => {
    if (_consumed) {
      throw new Error("Body has already been consumed");
    }
    if (_body.isLocked()) {
      throw new Error("The ReadableStream body is already locked and can't be consumed");
    }
    if (_body.isDisturbed()) {
      throw new Error("Body object should not be disturbed or locked");
    }
    _consumed = true;
    let result = new Uint8Array(0);
    const reader = _body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const newResult = new Uint8Array(result.length + value.length);
        newResult.set(result);
        newResult.set(value, result.length);
        result = newResult;
      }
      return result;
    } finally {
      reader.releaseLock();
    }
  };
  return {
    body: () => _body,
    bodyUsed: () => _consumed,
    arrayBuffer,
    // text,
    // json,
    contentEncoding: () => _contentEncoding,
    hash: () => _hash,
    size: () => _size
  };
};

// src/static-server/assets/asset-loader.js
var decoder2 = new TextDecoder();
var findMatchingSourceAndInfo = (acceptEncodingsGroups, defaultSourceAndInfo, sourceAndInfoForEncodingFn) => {
  const sourceAndInfo = defaultSourceAndInfo;
  const contentEncoding = null;
  if (acceptEncodingsGroups != null) {
  }
  return { sourceAndInfo, contentEncoding };
};
var createWasmInlineAsset = (metadata) => {
  const _metadata = { ...metadata };
  const _sourceAndInfo = {
    source: readFileSync(metadata.fileInfo.staticFilePath),
    hash: metadata.fileInfo.hash,
    size: metadata.fileInfo.size
  };
  const getStoreEntry = async () => {
    const { sourceAndInfo, contentEncoding } = findMatchingSourceAndInfo(
      null,
      // Fix: acceptEncodingsGroups, :Farq: Compression not yet implemented...
      _sourceAndInfo,
      () => {
      }
      // Fix: (encoding) => this.compressedSourcesAndInfo[encoding]
    );
    const { source, hash, size } = sourceAndInfo;
    return createEmbeddedStoreEntry(source, contentEncoding, hash, size);
  };
  return {
    assetKey: () => _metadata.assetKey,
    getStoreEntry,
    // farq: I think we can remove these, everything is being inlined at present.
    // text/json/bytes etc comes from kvStore implementation
    // isLocal: () => true,
    // getBytes: () => _sourceAndInfo.source,
    // getText,
    // getJson,
    getMetadata: () => _metadata
  };
};

// src/static-server/assets/static-assets.js
function createStaticAssetsCache(staticAssetManifest) {
  const assetLoaders = {
    // @ts-ignore
    "wasm-inline": (metadata) => createWasmInlineAsset(metadata)
  };
  const staticAssetsCache = createAssetCache({});
  for (const [assetKey, metadata] of Object.entries(staticAssetManifest)) {
    if (!(metadata.type in assetLoaders)) {
      throw new Error(`Unknown content asset type '${metadata.type}'`);
    }
    const asset = assetLoaders[metadata.type](metadata);
    staticAssetsCache.loadAsset(assetKey, asset);
  }
  return staticAssetsCache;
}

// src/static-server/index.js
var headersToPreserveFor304 = ["Content-Location", "ETag", "Vary", "Cache-Control", "Expires"];
function requestAcceptsTextHtml(req) {
  var _a;
  const accept = new Set(((_a = req.headers.get("Accept")) != null ? _a : "").split(",").map((x) => x.split(";")[0]));
  if (!accept.has("text/html") && !accept.has("*/*") && accept.has("*")) {
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
          headers: buildHeadersSubset(responseHeaders, headersToPreserveFor304)
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
          headers: buildHeadersSubset(responseHeaders, headersToPreserveFor304)
        });
      }
    }
  }
  return null;
};
var getStaticServer = (serverConfig, assetCache) => {
  const _serverConfig = serverConfig;
  const _assetCache = assetCache;
  const _staticItems = serverConfig.staticItems.map((x, i) => {
    if (x.startsWith("re:")) {
      const fragments = x.slice(3).match(/\/(.*?)\/([a-z]*)?$/i);
      if (fragments == null) {
        console.warn(`Cannot parse staticItems item index ${i}: '${x}', skipping...`);
        return "";
      }
      return new RegExp(fragments[1], fragments[2] || "");
    }
    return x;
  }).filter((x) => Boolean(x));
  const getMatchingAsset = (path) => {
    const assetKey = _serverConfig.publicDirPrefix + path;
    if (!assetKey.endsWith("/")) {
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
      while (assetNameAsDir.endsWith("/")) {
        assetNameAsDir = assetNameAsDir.slice(0, -1);
      }
      assetNameAsDir += "/";
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
    var _a;
    if (_serverConfig.compression.length === 0) {
      return [];
    }
    const found = ((_a = request.headers.get("accept-encoding")) != null ? _a : "").split(",").map((x) => {
      let [encodingValue, qValueStr] = x.trim().split(";");
      let qValue;
      if (qValueStr == null || !qValueStr.startsWith("q=")) {
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
    }).filter(([encoding]) => _serverConfig.compression.includes(encoding));
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
  const testExtendedCache = (pathname) => (
    // @ts-ignore
    _staticItems.some((x) => {
      if (x instanceof RegExp) {
        return x.test(pathname);
      }
      if (x.endsWith("/")) {
        return pathname.startsWith(x);
      }
      return x === pathname;
    })
  );
  const serveAsset = async (request, asset, init) => {
    var _a;
    const metadata = asset.getMetadata();
    const headers = {
      "Content-Type": metadata.contentType
    };
    Object.assign(headers, init == null ? void 0 : init.headers);
    if ((init == null ? void 0 : init.cache) != null) {
      let cacheControlValue;
      switch (init.cache) {
        case "extended":
          cacheControlValue = "max-age=31536000";
          break;
        case "never":
          cacheControlValue = "no-store";
          break;
        default:
          cacheControlValue = null;
      }
      if (cacheControlValue !== null) {
        headers["Cache-Control"] = cacheControlValue;
      }
    }
    const acceptEncodings = findAcceptEncodings(request);
    const storeEntry = await asset.getStoreEntry(acceptEncodings);
    const contentEncoding = storeEntry.contentEncoding();
    if (contentEncoding != null) {
      headers["Content-Encoding"] = contentEncoding;
    }
    headers.ETag = `"${storeEntry.hash()}"`;
    if (metadata.lastModifiedTime !== 0) {
      headers["Last-Modified"] = new Date(metadata.lastModifiedTime * 1e3).toUTCString();
    }
    const preconditionResponse = handlePreconditions(request, asset, headers);
    if (preconditionResponse != null) {
      return preconditionResponse;
    }
    return new Response(storeEntry.body(), {
      status: (_a = init == null ? void 0 : init.status) != null ? _a : 200,
      headers
    });
  };
  const serveRequest = async (request) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return null;
    }
    const url = new URL(request.url);
    const { pathname } = url;
    const asset = getMatchingAsset(pathname);
    if (asset != null) {
      return serveAsset(request, asset, {
        cache: testExtendedCache(pathname) ? "extended" : null
      });
    }
    if (requestAcceptsTextHtml(request)) {
      const { spaFile } = _serverConfig;
      if (spaFile != null) {
        const asset2 = _assetCache.getAsset(spaFile);
        if (asset2 != null) {
          return serveAsset(request, asset2, {
            cache: "never"
          });
        }
      }
      const { notFoundPageFile } = _serverConfig;
      if (notFoundPageFile != null) {
        const asset2 = _assetCache.getAsset(notFoundPageFile);
        if (asset2 != null) {
          return serveAsset(request, asset2, {
            status: 404,
            cache: "never"
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
    testExtendedCache
  };
};
export {
  createStaticAssetsCache,
  getStaticServer
};
