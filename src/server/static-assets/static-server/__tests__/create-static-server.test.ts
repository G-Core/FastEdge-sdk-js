import { createStaticServer } from '../create-static-server.ts';

import type { ServerConfig } from '../types.ts';
import type { StaticAssetManifest } from '~static-assets/asset-loader/create-static-assets-cache.ts';

// Mocks
const mockGetStaticServer = jest.fn();
const mockCreateStaticAssetsCache = jest.fn();
const mockNormalizeConfig = jest.fn();

jest.mock('../static-server', () => ({
  getStaticServer: (...args: any[]) => mockGetStaticServer(...args),
}));
jest.mock('~static-assets/asset-loader/create-static-assets-cache', () => ({
  createStaticAssetsCache: (...args: any[]) => mockCreateStaticAssetsCache(...args),
}));
jest.mock('~utils/config-helpers', () => ({
  normalizeConfig: (...args: any[]) => mockNormalizeConfig(...args),
}));

describe('createStaticServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize server config and create asset cache', () => {
    expect.assertions(4);
    const manifest: StaticAssetManifest = { assets: {} } as any;
    const partialConfig = { publicDirPrefix: '/public' };
    const normalizedConfig = {
      extendedCache: [],
      publicDirPrefix: '/public',
      compression: [],
      notFoundPage: '',
      autoExt: [],
      autoIndex: [],
      spaEntrypoint: null,
    } as ServerConfig;
    const assetCache = { cache: true };
    const staticServer = { serveRequest: jest.fn() };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateStaticAssetsCache.mockReturnValue(assetCache);
    mockGetStaticServer.mockReturnValue(staticServer);

    const result = createStaticServer(manifest, partialConfig);

    expect(mockNormalizeConfig).toHaveBeenCalledWith(partialConfig, expect.any(Object));
    expect(mockCreateStaticAssetsCache).toHaveBeenCalledWith(manifest);
    expect(mockGetStaticServer).toHaveBeenCalledWith(normalizedConfig, assetCache);
    expect(result).toBe(staticServer);
  });

  it('should pass all config keys to normalizeConfig', () => {
    expect.assertions(1);
    const manifest: StaticAssetManifest = { assets: {} } as any;
    const partialConfig = {
      publicDirPrefix: '/public',
      extendedCache: ['/public/longcache/'],
      compression: ['gzip'],
      notFoundPage: '/404.html',
      autoExt: ['.html'],
      autoIndex: ['index.html'],
      spaEntrypoint: '/spa.html',
    };
    const normalizedConfig = { ...partialConfig } as ServerConfig;
    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateStaticAssetsCache.mockReturnValue({});
    mockGetStaticServer.mockReturnValue({});

    createStaticServer(manifest, partialConfig);

    expect(mockNormalizeConfig).toHaveBeenCalledWith(
      partialConfig,
      expect.objectContaining({
        publicDirPrefix: 'string',
        extendedCache: 'pathsOrRegexArray',
        compression: 'stringArray',
        notFoundPage: 'path',
        autoExt: 'stringArray',
        autoIndex: 'stringArray',
        spaEntrypoint: 'path',
      }),
    );
  });

  it('should handle empty config and manifest', () => {
    expect.assertions(1);
    mockNormalizeConfig.mockReturnValue({} as ServerConfig);
    mockCreateStaticAssetsCache.mockReturnValue({});
    mockGetStaticServer.mockReturnValue({});

    const result = createStaticServer({} as StaticAssetManifest, {});
    expect(result).toStrictEqual({});
  });

  it('should return the StaticServer instance from getStaticServer', () => {
    expect.assertions(1);
    const manifest: StaticAssetManifest = { assets: {} } as any;
    const partialConfig = { publicDirPrefix: '/public' };
    const staticServer = { serveRequest: jest.fn() };
    mockNormalizeConfig.mockReturnValue({} as ServerConfig);
    mockCreateStaticAssetsCache.mockReturnValue({});
    mockGetStaticServer.mockReturnValue(staticServer);

    const result = createStaticServer(manifest, partialConfig);
    expect(result).toBe(staticServer);
  });
});
