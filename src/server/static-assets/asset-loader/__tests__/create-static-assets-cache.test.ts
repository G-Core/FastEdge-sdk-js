import { createStaticAssetsCache } from '../create-static-assets-cache.ts';

import type { StaticAsset, StaticAssetMetadata } from '../inline-asset/inline-asset.ts';
import type { StaticAssetManifest } from '../types.ts';

// Mock the dependencies
jest.mock('../asset-cache/asset-cache');
jest.mock('../inline-asset/inline-asset');

const mockCreateAssetCache = jest.fn();
jest.mock('../asset-cache//asset-cache', () => ({
  createAssetCache: jest.fn((...args) => mockCreateAssetCache(...args)),
}));

const mockCreateWasmInlineAsset = jest.fn();
jest.mock('../inline-asset/inline-asset', () => ({
  createWasmInlineAsset: jest.fn((...args) => mockCreateWasmInlineAsset(...args)),
}));

const createTestMetadata = (overrides?: Partial<StaticAssetMetadata>): StaticAssetMetadata => ({
  assetKey: 'test-asset',
  type: 'wasm-inline',
  contentType: 'text/html',
  isText: true,
  fileInfo: {
    assetPath: '/test.html',
    hash: 'hash123',
    lastModifiedTime: 1672531200000,
    size: 100,
  },
  ...overrides,
});

describe('createStaticAssetsCache', () => {
  // Mock asset cache instance
  const mockAssetCacheInstance = {
    loadAsset: jest.fn(),
    getAsset: jest.fn(),
    hasAsset: jest.fn(),
    removeAsset: jest.fn(),
    getAllAssets: jest.fn(),
    clear: jest.fn(),
    size: jest.fn(),
  } as any;

  // Mock static asset instance
  const mockStaticAsset = {
    assetKey: 'test-asset',
    type: 'wasm-inline',
    getMetadata: jest.fn(),
    getEmbeddedStoreEntry: jest.fn(),
    getText: jest.fn(),
  } as jest.Mocked<StaticAsset>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    mockCreateAssetCache.mockReturnValue(mockAssetCacheInstance);
    mockCreateWasmInlineAsset.mockReturnValue(mockStaticAsset);

    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create asset cache with empty manifest', () => {
      expect.assertions(3);
      const emptyManifest: StaticAssetManifest = {};

      const result = createStaticAssetsCache(emptyManifest);

      expect(result).toBe(mockAssetCacheInstance);
      expect(mockCreateAssetCache).toHaveBeenCalledWith({});
      expect(mockAssetCacheInstance.loadAsset).not.toHaveBeenCalled();
    });

    it('should create asset cache instance', () => {
      expect.assertions(2);
      const manifest: StaticAssetManifest = {};

      createStaticAssetsCache(manifest);

      expect(mockCreateAssetCache).toHaveBeenCalledTimes(1);
      expect(mockCreateAssetCache).toHaveBeenCalledWith({});
    });
  });
  describe('asset loading', () => {
    it('should load single wasm-inline asset', () => {
      expect.assertions(2);
      const metadata = createTestMetadata();
      const manifest: StaticAssetManifest = {
        'test-asset': metadata,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(metadata);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('test-asset', mockStaticAsset);
    });

    it('should load multiple assets', () => {
      expect.assertions(8);
      const metadata1 = createTestMetadata({
        assetKey: 'asset1',
        contentType: 'text/html',
      });
      const metadata2 = createTestMetadata({
        assetKey: 'asset2',
        contentType: 'text/css',
        fileInfo: {
          assetPath: '/styles.css',
          hash: 'hash456',
          lastModifiedTime: 1672531200000,
          size: 200,
        },
      });
      const metadata3 = createTestMetadata({
        assetKey: 'asset3',
        contentType: 'application/javascript',
        fileInfo: {
          assetPath: '/script.js',
          hash: 'hash789',
          lastModifiedTime: 1672531200000,
          size: 300,
        },
      });

      const manifest: StaticAssetManifest = {
        asset1: metadata1,
        asset2: metadata2,
        asset3: metadata3,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledTimes(3);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(metadata1);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(metadata2);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(metadata3);

      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledTimes(3);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('asset1', mockStaticAsset);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('asset2', mockStaticAsset);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('asset3', mockStaticAsset);
    });

    it('should preserve asset key mapping', () => {
      expect.assertions(3);
      const metadata1 = createTestMetadata({ assetKey: 'index.html' });
      const metadata2 = createTestMetadata({ assetKey: 'styles/main.css' });
      const metadata3 = createTestMetadata({ assetKey: 'js/app.js' });

      const manifest: StaticAssetManifest = {
        'index.html': metadata1,
        'styles/main.css': metadata2,
        'js/app.js': metadata3,
      };

      createStaticAssetsCache(manifest);

      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('index.html', mockStaticAsset);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith(
        'styles/main.css',
        mockStaticAsset,
      );
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('js/app.js', mockStaticAsset);
    });

    it('should handle assets with different content types', () => {
      expect.assertions(4);
      const htmlAsset = createTestMetadata({
        assetKey: 'page.html',
        contentType: 'text/html; charset=utf-8',
      });
      const cssAsset = createTestMetadata({
        assetKey: 'style.css',
        contentType: 'text/css',
      });
      const jsAsset = createTestMetadata({
        assetKey: 'script.js',
        contentType: 'application/javascript',
      });
      const jsonAsset = createTestMetadata({
        assetKey: 'data.json',
        contentType: 'application/json',
      });

      const manifest: StaticAssetManifest = {
        'page.html': htmlAsset,
        'style.css': cssAsset,
        'script.js': jsAsset,
        'data.json': jsonAsset,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(htmlAsset);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(cssAsset);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(jsAsset);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(jsonAsset);
    });

    it('should handle assets with complex file paths', () => {
      expect.assertions(2);
      const complexPaths = [
        '/deep/nested/folder/file.html',
        './relative/path.css',
        '../parent/directory/script.js',
        'simple-file.txt',
        '/assets/images/logo.png',
        '/fonts/custom-font.woff2',
      ];

      const manifest: StaticAssetManifest = {};
      for (const [index, path] of complexPaths.entries()) {
        const assetKey = `asset-${index}`;
        manifest[assetKey] = createTestMetadata({
          assetKey,
          fileInfo: {
            assetPath: path,
            hash: `hash-${index}`,
            lastModifiedTime: 1672531200000,
            size: 100 + index,
          },
        });
      }

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledTimes(complexPaths.length);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledTimes(complexPaths.length);
    });

    it('should handle assets with special characters in keys', () => {
      expect.assertions(5);
      const specialKeys = [
        'file!@#$%^&*().html',
        'unicode-文件-🌍.txt',
        'spaces in name.css',
        'dots.and.more.dots.js',
        'underscores_and-dashes.json',
      ];

      const manifest: StaticAssetManifest = {};
      for (const key of specialKeys) {
        manifest[key] = createTestMetadata({
          assetKey: key,
          fileInfo: {
            assetPath: `/path/${key}`,
            hash: `hash-${key}`,
            lastModifiedTime: 1672531200000,
            size: 100,
          },
        });
      }
      createStaticAssetsCache(manifest);
      for (const key of specialKeys) {
        expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith(key, mockStaticAsset);
      }
    });
  });

  describe('asset loaders', () => {
    it('should use wasm-inline loader for wasm-inline type', () => {
      expect.assertions(1);
      const metadata = createTestMetadata({ type: 'wasm-inline' });
      const manifest: StaticAssetManifest = {
        test: metadata,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(metadata);
    });

    it('should only support wasm-inline asset type', () => {
      expect.assertions(1);
      const metadata = createTestMetadata({ type: 'wasm-inline' });
      const manifest: StaticAssetManifest = {
        'valid-asset': metadata,
      };

      expect(() => createStaticAssetsCache(manifest)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle assets with minimal metadata', () => {
      expect.assertions(2);
      const minimalMetadata: StaticAssetMetadata = {
        assetKey: 'minimal',
        type: 'wasm-inline',
        contentType: 'text/plain',
        isText: true,
        fileInfo: {
          assetPath: '/minimal.txt',
          hash: 'hash',
          lastModifiedTime: 0,
          size: 0,
        },
      };

      const manifest: StaticAssetManifest = {
        minimal: minimalMetadata,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(minimalMetadata);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith('minimal', mockStaticAsset);
    });

    it('should handle assets with maximum metadata', () => {
      expect.assertions(2);
      const maximalMetadata: StaticAssetMetadata = {
        assetKey: 'maximal-asset-with-very-long-name-that-includes-many-details',
        type: 'wasm-inline',
        contentType: 'text/html; charset=utf-8; boundary=something',
        isText: true,
        fileInfo: {
          assetPath: '/very/deep/nested/folder/structure/with/many/levels/file.html',
          hash: `sha256-${'a'.repeat(64)}`,
          lastModifiedTime: 9999999999999,
          size: Number.MAX_SAFE_INTEGER,
        },
      };

      const manifest: StaticAssetManifest = {
        'maximal-asset': maximalMetadata,
      };

      createStaticAssetsCache(manifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(maximalMetadata);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledWith(
        'maximal-asset',
        mockStaticAsset,
      );
    });

    it('should handle large manifests', () => {
      expect.assertions(2);
      const largeManifest: StaticAssetManifest = {};
      // Create 1000 assets
      for (let i = 0; i < 1000; i++) {
        largeManifest[`asset-${i}`] = createTestMetadata({
          assetKey: `asset-${i}`,
          fileInfo: {
            assetPath: `/assets/file-${i}.html`,
            hash: `hash-${i}`,
            lastModifiedTime: 1672531200000 + i,
            size: 100 + i,
          },
        });
      }

      createStaticAssetsCache(largeManifest);

      expect(mockCreateWasmInlineAsset).toHaveBeenCalledTimes(1000);
      expect(mockAssetCacheInstance.loadAsset).toHaveBeenCalledTimes(1000);
    });

    it('should handle duplicate asset keys (object behavior)', () => {
      expect.assertions(2);
      // JavaScript objects don't allow duplicate keys, but we test the behavior
      const manifest: StaticAssetManifest = {
        'duplicate-key': createTestMetadata({
          assetKey: 'first-value',
          contentType: 'text/html',
        }),
      };

      // Overwrite with same key
      manifest['duplicate-key'] = createTestMetadata({
        assetKey: 'second-value',
        contentType: 'text/css',
      });

      createStaticAssetsCache(manifest);

      // Should only process the last value for the key
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledTimes(1);
      expect(mockCreateWasmInlineAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          assetKey: 'second-value',
          contentType: 'text/css',
        }),
      );
    });
  });

  describe('integration', () => {
    it('should return the asset cache instance', () => {
      expect.assertions(4);
      const manifest: StaticAssetManifest = {
        test: createTestMetadata(),
      };

      const result = createStaticAssetsCache(manifest);

      expect(result).toBe(mockAssetCacheInstance);
      expect(result).toHaveProperty('loadAsset');
      expect(result).toHaveProperty('getAsset');
      expect(result).toHaveProperty('hasAsset');
    });

    it('should work with real asset cache methods', () => {
      expect.assertions(2);
      const manifest: StaticAssetManifest = {
        'integration-test': createTestMetadata({
          assetKey: 'integration-test',
        }),
      };

      const cache = createStaticAssetsCache(manifest);

      // Verify the cache instance has expected methods
      expect(typeof cache.loadAsset).toBe('function');
      expect(typeof cache.getAsset).toBe('function');
    });

    it('should process assets in manifest order', () => {
      expect.assertions(3);
      const manifest: StaticAssetManifest = {
        third: createTestMetadata({ assetKey: 'third' }),
        first: createTestMetadata({ assetKey: 'first' }),
        second: createTestMetadata({ assetKey: 'second' }),
      };

      createStaticAssetsCache(manifest);

      // JavaScript objects maintain insertion order in modern engines
      const loadAssetCalls = mockAssetCacheInstance.loadAsset.mock.calls;
      expect(loadAssetCalls[0][0]).toBe('third');
      expect(loadAssetCalls[1][0]).toBe('first');
      expect(loadAssetCalls[2][0]).toBe('second');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should throw error for unknown asset type', () => {
      expect.assertions(1);
      const invalidMetadata = createTestMetadata({
        type: 'unknown-type' as any,
      });
      const manifest: StaticAssetManifest = {
        'invalid-asset': invalidMetadata,
      };

      expect(() => createStaticAssetsCache(manifest)).toThrow(
        "Unknown content asset type 'unknown-type'",
      );
    });

    it('should throw error for multiple unknown asset types', () => {
      expect.assertions(2);
      const manifest: StaticAssetManifest = {
        asset1: createTestMetadata({ type: 'invalid-type1' as any }),
        asset2: createTestMetadata({ type: 'wasm-inline' }), // Valid one
        asset3: createTestMetadata({ type: 'invalid-type2' as any }),
      };

      // Should fail on the first invalid type
      expect(() => createStaticAssetsCache(manifest)).toThrow(
        "Unknown content asset type 'invalid-type1'",
      );

      // Should not have loaded any assets due to early failure
      expect(mockAssetCacheInstance.loadAsset).not.toHaveBeenCalled();
    });

    it('should handle error in asset creation', () => {
      expect.assertions(1);
      const metadata = createTestMetadata();
      const manifest: StaticAssetManifest = {
        'failing-asset': metadata,
      };

      mockCreateWasmInlineAsset.mockImplementation(() => {
        throw new Error('Failed to create asset');
      });

      expect(() => createStaticAssetsCache(manifest)).toThrow('Failed to create asset');
    });

    it('should handle error in asset cache loading', () => {
      expect.assertions(1);
      const metadata = createTestMetadata();
      const manifest: StaticAssetManifest = {
        'test-asset': metadata,
      };

      mockAssetCacheInstance.loadAsset.mockImplementation(() => {
        throw new Error('Failed to load asset into cache');
      });

      expect(() => createStaticAssetsCache(manifest)).toThrow('Failed to load asset into cache');
    });

    it('should provide meaningful error message with asset key', () => {
      expect.assertions(1);
      const manifest: StaticAssetManifest = {
        'problematic-asset': createTestMetadata({
          assetKey: 'problematic-asset',
          type: 'unsupported-type' as any,
        }),
      };

      expect(() => createStaticAssetsCache(manifest)).toThrow(
        "Unknown content asset type 'unsupported-type'",
      );
    });
  });
});
