import { getStaticServer } from '../static-server.ts';

import type { ServerConfig } from '../types.ts';

import type { AssetCache } from '~static-assets/asset-loader/asset-cache/asset-cache.ts';
import type { StaticAsset } from '~static-assets/asset-loader/inline-asset/inline-asset.ts';

function mockAsset(metadata: any, storeEntry?: any): StaticAsset {
  return {
    getMetadata: () => metadata,
    getEmbeddedStoreEntry: async () =>
      storeEntry ?? {
        body: () => new Uint8Array([1, 2, 3]),
        contentEncoding: () => null,
        hash: () => 'mockhash',
      },
  } as unknown as StaticAsset;
}

function mockAssetCache(assets: Record<string, StaticAsset>): AssetCache<StaticAsset> {
  return {
    getAsset: (key: string) => assets[key] ?? null,
  } as AssetCache<StaticAsset>;
}

function makeRequest(url: string, method = 'GET', headers: Record<string, string> = {}) {
  return new Request(url, { method, headers });
}

describe('getStaticServer', () => {
  let serverConfig: ServerConfig;
  let assetCache: AssetCache<StaticAsset>;
  let server: ReturnType<typeof getStaticServer>;

  beforeEach(() => {
    serverConfig = {
      publicDirPrefix: '',
      autoExt: ['.html', '.txt'],
      autoIndex: ['index.html'],
      compression: ['gzip', 'br'],
      extendedCache: ['/public/longcache/', /^\/public\/regexcache/u],
      spaEntrypoint: '/spa.html',
      notFoundPage: '/404.html',
    } as ServerConfig;

    assetCache = mockAssetCache({});
    server = getStaticServer(serverConfig, assetCache);
  });

  describe('getMatchingAsset', () => {
    it('should match asset directly', () => {
      expect.assertions(1);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test': asset });
      server = getStaticServer(serverConfig, assetCache);
      expect(server.getMatchingAsset('/public/test')).toBe(asset);
    });

    it('should match asset with autoExt', () => {
      expect.assertions(1);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);
      expect(server.getMatchingAsset('/public/test')).toBe(asset);
    });

    it('should match asset with autoIndex', () => {
      expect.assertions(1);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test/index.html': asset });
      server = getStaticServer(serverConfig, assetCache);
      expect(server.getMatchingAsset('/public/test/')).toBe(asset);
    });

    it('should return null if no asset matches', () => {
      expect.assertions(1);
      assetCache = mockAssetCache({});
      server = getStaticServer(serverConfig, assetCache);
      expect(server.getMatchingAsset('/public/notfound')).toBeNull();
    });
  });

  describe('findAcceptEncodings', () => {
    it('should parse accept-encoding header and sort by q', () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/', 'GET', {
        'accept-encoding': 'gzip;q=0.8, br;q=1.0',
      });
      const result = server.findAcceptEncodings(req);
      expect(result.flat()).toStrictEqual(['br', 'gzip']);
    });

    it('should handle missing accept-encoding', () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/', 'GET');
      expect(server.findAcceptEncodings(req)).toStrictEqual([]);
    });

    it('should ignore encodings not in config', () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/', 'GET', {
        'accept-encoding': 'deflate, gzip',
      });
      expect(server.findAcceptEncodings(req).flat()).toStrictEqual(['gzip']);
    });

    it('should handle q values out of range', () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/', 'GET', {
        'accept-encoding': 'gzip;q=2, br;q=-1',
      });
      expect(server.findAcceptEncodings(req).flat()).toStrictEqual(['gzip', 'br']);
    });
  });

  describe('testExtendedCache', () => {
    it('should match string prefix', () => {
      expect.assertions(1);
      expect(server.testExtendedCache('/public/longcache/file.txt')).toBe(true);
    });
    it('should match regex', () => {
      expect.assertions(1);
      expect(server.testExtendedCache('/public/regexcache/file.txt')).toBe(true);
    });
    it('should not match unrelated path', () => {
      expect.assertions(1);
      expect(server.testExtendedCache('/public/other/file.txt')).toBe(false);
    });
  });

  describe('handlePreconditions', () => {
    const asset = mockAsset({
      contentType: 'text/html',
      fileInfo: { lastModifiedTime: 123 },
    });
    const headers = {
      ETag: 'mockhash',
      'Last-Modified': 'Mon, 01 Jan 2001 00:00:00 GMT',
    };

    it('should return 304 for If-None-Match mismatch', () => {
      expect.assertions(2);
      const req = makeRequest('http://localhost/', 'GET', {
        'If-None-Match': 'mockhash',
      });
      const resp = server.handlePreconditions(req, asset, headers);
      expect(resp).toBeInstanceOf(Response);
      expect(resp?.status).toBe(304);
    });

    it('should return 304 for If-Modified-Since mismatch', () => {
      expect.assertions(2);
      const req = makeRequest('http://localhost/', 'GET', {
        'If-Modified-Since': 'Mon, 01 Jan 2001 00:00:00 GMT',
      });
      const resp = server.handlePreconditions(req, asset, headers);
      expect(resp).toBeInstanceOf(Response);
      expect(resp?.status).toBe(304);
    });

    it('should return null if no precondition fails', () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/', 'GET');
      const resp = server.handlePreconditions(req, asset, headers);
      expect(resp).toBeNull();
    });
  });

  describe('serveAsset', () => {
    it('should return a Response with correct headers', async () => {
      expect.assertions(5);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/public/test.html', 'GET');
      const resp = await server.serveAsset(req, asset, { cache: 'extended' });
      expect(resp).toBeInstanceOf(Response);
      expect(resp.headers.get('Content-Type')).toBe('text/html');
      expect(resp.headers.get('Cache-Control')).toBe('max-age=31536000');
      expect(resp.headers.get('ETag')).toBe('mockhash');
      expect(resp.status).toBe(200);
    });

    it('should set Content-Encoding if present', async () => {
      expect.assertions(1);
      const storeEntry = {
        body: () => new Uint8Array([1, 2, 3]),
        contentEncoding: () => 'gzip',
        hash: () => 'mockhash',
      };
      const asset = mockAsset(
        { contentType: 'text/html', fileInfo: { lastModifiedTime: 123 } },
        storeEntry,
      );
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/public/test.html', 'GET');
      const resp = await server.serveAsset(req, asset, { cache: 'extended' });
      expect(resp.headers.get('Content-Encoding')).toBe('gzip');
    });

    it('should set Last-Modified if present', async () => {
      expect.assertions(1);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 1234567890 },
      });
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/public/test.html', 'GET');
      const resp = await server.serveAsset(req, asset, { cache: 'extended' });
      expect(resp.headers.get('Last-Modified')).toBe(new Date(1234567890 * 1000).toUTCString());
    });

    it('should return 304 if precondition fails', async () => {
      expect.assertions(1);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/public/test.html', 'GET', {
        'If-None-Match': 'mockhash',
      });
      const resp = await server.serveAsset(req, asset, { cache: 'extended' });
      expect(resp.status).toBe(304);
    });
  });
  describe('serveRequest', () => {
    it('should serve asset for matching path', async () => {
      expect.assertions(2);
      const asset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ '/public/test.html': asset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/public/test.html', 'GET');
      const resp = await server.serveRequest(req);
      expect(resp).toBeInstanceOf(Response);
      expect(resp?.status).toBe(200);
    });

    it('should serve SPA entrypoint if asset not found and Accept: text/html', async () => {
      expect.assertions(2);
      const spaAsset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({ [serverConfig.spaEntrypoint!]: spaAsset });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/unknown', 'GET', {
        Accept: 'text/html',
      });
      const resp = await server.serveRequest(req);
      expect(resp).toBeInstanceOf(Response);
      expect(resp?.status).toBe(200);
    });

    it('should serve notFoundPage if asset not found and Accept: text/html', async () => {
      expect.assertions(2);
      const notFoundAsset = mockAsset({
        contentType: 'text/html',
        fileInfo: { lastModifiedTime: 123 },
      });
      assetCache = mockAssetCache({
        [serverConfig.notFoundPage!]: notFoundAsset,
      });
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/unknown', 'GET', {
        Accept: 'text/html',
      });
      const resp = await server.serveRequest(req);
      expect(resp).toBeInstanceOf(Response);
      expect(resp?.status).toBe(404);
    });

    it('should return null for non-GET/HEAD requests', async () => {
      expect.assertions(1);
      const req = makeRequest('http://localhost/public/test.html', 'POST');
      const resp = await server.serveRequest(req);
      expect(resp).toBeNull();
    });

    it('should return null if no asset and no fallback', async () => {
      expect.assertions(1);
      assetCache = mockAssetCache({});
      serverConfig.spaEntrypoint = null;
      serverConfig.notFoundPage = null;
      server = getStaticServer(serverConfig, assetCache);

      const req = makeRequest('http://localhost/unknown', 'GET', {
        Accept: 'text/html',
      });
      const resp = await server.serveRequest(req);
      expect(resp).toBeNull();
    });
  });
});
