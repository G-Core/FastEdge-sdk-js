import { createTestFileBinaryArray } from '../__fixtures__/index.ts';
import { createWasmInlineAsset } from '../inline-asset/inline-asset.ts';

import type { StaticAssetMetadata } from '../inline-asset/inline-asset.ts';

const mockReadFileSync = jest.fn();
jest.mock('fastedge::fs', () => ({
  readFileSync: jest.fn((...args) => mockReadFileSync(...args)),
}));

const mockCreateEmbeddedStoreEntry = jest.fn();
jest.mock('../embedded-store-entry/embedded-store-entry', () => ({
  createEmbeddedStoreEntry: jest.fn((...args) => mockCreateEmbeddedStoreEntry(...args)),
}));

const testLastModified = () => new Date('2023-01-01T00:00:00Z').getTime();

const runSlowTests = process.env.RUN_SLOW_TESTS === 'true';

const createTestMetadata = (overrides?: Partial<StaticAssetMetadata>): StaticAssetMetadata => ({
  assetKey: 'test-asset',
  type: 'wasm-inline',
  contentType: 'text/html; charset=utf-8',
  fileInfo: {
    assetPath: '/path/to/test.html',
    hash: 'sha256-abcdef123456',
    lastModifiedTime: testLastModified(),
    size: 1024,
  },
  ...overrides,
});

describe('inline-asset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWasmInlineAsset', () => {
    describe('initialization', () => {
      it('should create inline asset with basic metadata', () => {
        expect.assertions(5);
        const metadata = createTestMetadata({ contentType: 'text/html' });
        const fileData = createTestFileBinaryArray();

        mockReadFileSync.mockReturnValue(fileData);

        const asset = createWasmInlineAsset(metadata);

        expect(asset).toBeDefined();
        expect(asset.assetKey).toBe('test-asset');
        expect(asset.type).toBe('wasm-inline');
        expect(asset.getMetadata()).toStrictEqual(metadata);
        expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/test.html');
      });

      it('should handle different asset types', () => {
        expect.assertions(3);
        const cssMetadata = createTestMetadata({
          assetKey: 'styles.css',
          contentType: 'text/css',
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(cssMetadata);

        expect(asset.assetKey).toBe('styles.css');
        expect(asset.type).toBe('wasm-inline');
        expect(asset.getMetadata().contentType).toBe('text/css');
      });

      it('should handle binary assets', () => {
        expect.assertions(3);
        const imageMetadata = createTestMetadata({
          assetKey: 'image.png',
          contentType: 'image/png',
        });

        const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
        mockReadFileSync.mockReturnValue(binaryData);

        const asset = createWasmInlineAsset(imageMetadata);

        expect(asset.assetKey).toBe('image.png');
        expect(asset.type).toBe('wasm-inline');
        expect(asset.getMetadata().contentType).toBe('image/png');
      });

      it('should preserve all metadata properties', () => {
        expect.assertions(4);
        const metadata = createTestMetadata({
          assetKey: 'complex-asset',
          contentType: 'application/json',
          fileInfo: {
            assetPath: '/complex/path/data.json',
            hash: 'sha256-complex123',
            lastModifiedTime: testLastModified(),
            size: 2048,
          },
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(metadata);
        const retrievedMetadata = asset.getMetadata();

        expect(retrievedMetadata).toStrictEqual(metadata);
        expect(retrievedMetadata.fileInfo.assetPath).toBe('/complex/path/data.json');
        expect(retrievedMetadata.fileInfo.hash).toBe('sha256-complex123');
        expect(retrievedMetadata.fileInfo.size).toBe(2048);
      });
    });

    describe('getEmbeddedStoreEntry method', () => {
      it('should return embedded store entry with correct data', async () => {
        expect.assertions(2);
        const metadata = createTestMetadata();
        const mockFileContent = 'Hello, World! This is test data.';
        const mockStoreEntry = createTestFileBinaryArray(mockFileContent);

        mockReadFileSync.mockReturnValue(mockFileContent);
        mockCreateEmbeddedStoreEntry.mockReturnValue(mockStoreEntry);

        const asset = createWasmInlineAsset(metadata);
        const storeEntry = await asset.getEmbeddedStoreEntry('test-asset');

        expect(storeEntry).toBe(mockStoreEntry);
        expect(mockCreateEmbeddedStoreEntry).toHaveBeenCalledWith(
          mockFileContent,
          null,
          'sha256-abcdef123456',
          1024,
        );
      });

      it('should handle multiple calls to getEmbeddedStoreEntry', async () => {
        expect.assertions(3);
        const metadata = createTestMetadata();
        const mockFileContent = 'Hello, World! This is test data.';
        const mockStoreEntry = createTestFileBinaryArray(mockFileContent);

        mockReadFileSync.mockReturnValue(mockFileContent);
        mockCreateEmbeddedStoreEntry.mockReturnValue(mockStoreEntry);

        const asset = createWasmInlineAsset(metadata);
        const storeEntryFirst = await asset.getEmbeddedStoreEntry('test-asset');
        const storeEntrySecond = await asset.getEmbeddedStoreEntry('test-asset');

        expect(storeEntryFirst).toBe(mockStoreEntry);
        expect(storeEntrySecond).toBe(mockStoreEntry);
        expect(mockCreateEmbeddedStoreEntry).toHaveBeenCalledWith(
          mockFileContent,
          null,
          'sha256-abcdef123456',
          1024,
        );
      });

      if (runSlowTests) {
        it('should handle large files [slow]', async () => {
          expect.assertions(1);
          const TWO_MB = 2 * 1024 * 1024;
          const metadata = createTestMetadata({
            fileInfo: {
              assetPath: '/large/file.bin',
              hash: 'sha256-largefile',
              lastModifiedTime: new Date('2023-01-01T00:00:00Z').getTime(),
              size: TWO_MB,
            },
          });

          const largeData = new Uint8Array(TWO_MB);
          largeData.fill(42);

          mockReadFileSync.mockReturnValue(largeData);
          mockCreateEmbeddedStoreEntry.mockReturnValue({} as any);

          const asset = createWasmInlineAsset(metadata);
          await asset.getEmbeddedStoreEntry('test-asset');

          expect(mockCreateEmbeddedStoreEntry).toHaveBeenCalledWith(
            largeData,
            null,
            'sha256-largefile',
            TWO_MB,
          );
        });
      }

      it('should handle empty files', async () => {
        expect.assertions(1);
        const metadata = createTestMetadata({
          fileInfo: {
            assetPath: '/empty/file.txt',
            hash: 'sha256-empty',
            lastModifiedTime: testLastModified(),
            size: 0,
          },
        });

        const emptyData = new Uint8Array(0);
        mockReadFileSync.mockReturnValue(emptyData);
        mockCreateEmbeddedStoreEntry.mockReturnValue({} as any);

        const asset = createWasmInlineAsset(metadata);
        await asset.getEmbeddedStoreEntry('test-asset');

        expect(mockCreateEmbeddedStoreEntry).toHaveBeenCalledWith(
          emptyData,
          null,
          'sha256-empty',
          0,
        );
      });
    });

    describe('file reading', () => {
      it('should read file using correct path', () => {
        expect.assertions(2);
        const metadata = createTestMetadata({
          fileInfo: {
            assetPath: '/custom/path/file.js',
            hash: 'hash123',
            lastModifiedTime: testLastModified(),
            size: 512,
          },
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        createWasmInlineAsset(metadata);

        expect(mockReadFileSync).toHaveBeenCalledWith('/custom/path/file.js');
        expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      });

      it('should handle file read errors', () => {
        expect.assertions(1);
        const metadata = createTestMetadata();

        mockReadFileSync.mockImplementation(() => {
          throw new Error('File not found');
        });

        expect(() => createWasmInlineAsset(metadata)).toThrow('File not found');
      });

      it('should handle different file paths', () => {
        expect.assertions(5);
        const testPaths = [
          '/root/index.html',
          './relative/path.css',
          '../parent/script.js',
          'simple-file.txt',
          '/deep/nested/folder/structure/file.json',
        ];

        for (const path of testPaths) {
          const metadata = createTestMetadata({
            assetKey: `asset-${path}`,
            fileInfo: {
              assetPath: path,
              hash: `hash-${path}`,
              lastModifiedTime: testLastModified(),
              size: 100,
            },
          });

          mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

          createWasmInlineAsset(metadata);

          expect(mockReadFileSync).toHaveBeenCalledWith(path);
          mockReadFileSync.mockClear();
        }
      });
    });

    describe('metadata handling', () => {
      it('should not mutate original metadata', () => {
        expect.assertions(3);
        const originalMetadata = createTestMetadata();
        const originalMetadataCopy = JSON.parse(JSON.stringify(originalMetadata));

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(originalMetadata);
        const retrievedMetadata = asset.getMetadata();

        // Modify retrieved metadata
        retrievedMetadata.assetKey = 'modified';
        retrievedMetadata.contentType = 'modified/type';

        // Original should be unchanged
        expect(originalMetadata).toStrictEqual(originalMetadataCopy);
        expect(originalMetadata.assetKey).toBe('test-asset');
        expect(originalMetadata.contentType).toBe('text/html; charset=utf-8');
      });

      it('should handle special characters in metadata', () => {
        expect.assertions(2);
        const metadata = createTestMetadata({
          assetKey: 'special!@#$%^&*()_+-={}[]|\\:;"\'<>?,./',
          type: 'text/special-chars',
          fileInfo: {
            assetPath: '/special/chars!@#/file.txt',
            hash: 'sha256-special!@#$%',
            lastModifiedTime: testLastModified(),
            size: 123,
          },
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(metadata);

        expect(asset.assetKey).toBe('special!@#$%^&*()_+-={}[]|\\:;"\'<>?,./');
        expect(asset.getMetadata().fileInfo.hash).toBe('sha256-special!@#$%');
      });

      it('should handle Unicode in metadata', () => {
        expect.assertions(2);
        const metadata = createTestMetadata({
          assetKey: 'unicode-文件-🌍-αβγ',
          type: 'text/unicode',
          fileInfo: {
            assetPath: '/unicode/文件🌍.txt',
            hash: 'sha256-unicode-αβγ',
            lastModifiedTime: testLastModified(),
            size: 456,
          },
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(metadata);

        expect(asset.assetKey).toBe('unicode-文件-🌍-αβγ');
        expect(asset.getMetadata().fileInfo.assetPath).toBe('/unicode/文件🌍.txt');
      });
    });

    describe('edge cases', () => {
      it('should handle metadata with minimal required fields', () => {
        expect.assertions(3);
        const minimalMetadata: StaticAssetMetadata = {
          assetKey: 'minimal',
          type: 'wasm-inline',
          contentType: 'text/plain',
          fileInfo: {
            assetPath: '/minimal.txt',
            hash: 'hash',
            lastModifiedTime: testLastModified(),
            size: 1,
          },
        };

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(minimalMetadata);

        expect(asset.assetKey).toBe('minimal');
        expect(asset.type).toBe('wasm-inline');
        expect(asset.getMetadata()).toStrictEqual(minimalMetadata);
      });

      it('should handle zero-size files', () => {
        expect.assertions(1);
        const metadata = createTestMetadata({
          fileInfo: {
            assetPath: '/zero.txt',
            hash: 'zero-hash',
            lastModifiedTime: testLastModified(),
            size: 0,
          },
        });

        mockReadFileSync.mockReturnValue(new Uint8Array(0));

        const asset = createWasmInlineAsset(metadata);

        expect(asset.getMetadata().fileInfo.size).toBe(0);
      });

      it('should handle very long asset keys', () => {
        expect.assertions(2);
        const longKey = 'a'.repeat(1000);
        const metadata = createTestMetadata({
          assetKey: longKey,
        });

        mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

        const asset = createWasmInlineAsset(metadata);

        expect(asset.assetKey).toBe(longKey);
        expect(asset.assetKey).toHaveLength(1000);
      });

      it('should handle various MIME types', () => {
        expect.assertions(22);
        const mimeTypes = [
          'text/html',
          'text/css',
          'text/javascript',
          'application/json',
          'image/png',
          'image/jpeg',
          'image/svg+xml',
          'font/woff2',
          'application/pdf',
          'video/mp4',
          'audio/mpeg',
        ];

        for (const mimeType of mimeTypes) {
          const metadata = createTestMetadata({
            assetKey: `file-${mimeType.replace('/', '-')}`,
            type: 'wasm-inline',
            contentType: mimeType,
          });

          mockReadFileSync.mockReturnValue(createTestFileBinaryArray());

          const asset = createWasmInlineAsset(metadata);

          expect(asset.type).toBe('wasm-inline');
          expect(asset.getMetadata().contentType).toBe(mimeType);
          mockReadFileSync.mockClear();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should propagate file system errors', () => {
      expect.assertions(1);
      const metadata = {
        assetKey: 'error-file',
        type: 'wasm-inline',
        contentType: 'text/plain',
        fileInfo: {
          assetPath: '/nonexistent/file.txt',
          hash: 'hash',
          lastModifiedTime: testLastModified(),
          size: 100,
        },
      };

      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => createWasmInlineAsset(metadata)).toThrow('ENOENT: no such file or directory');
    });

    it('should handle permission errors', () => {
      expect.assertions(1);
      const metadata = {
        assetKey: 'permission-denied',
        type: 'wasm-inline',
        contentType: 'text/plain',
        text: true,
        fileInfo: {
          assetPath: '/restricted/file.txt',
          hash: 'hash',
          lastModifiedTime: testLastModified(),
          size: 100,
        },
      };

      mockReadFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => createWasmInlineAsset(metadata)).toThrow('EACCES: permission denied');
    });
  });
});
