import path from 'node:path';

import { createManifestFileMap } from '../create-manifest-file-map.ts';

import type { AssetCacheConfig } from '../types.ts';

// Mocks
const mockColorLog = jest.fn();
const mockGetFilesRecursively = jest.fn();
const mockCreateFileInfo = jest.fn();
const mockGetKnownContentTypes = jest.fn();
const mockTestFileContentType = jest.fn();

jest.mock('~utils/color-log', () => ({
  colorLog: (...args: any[]) => mockColorLog(...args),
}));
jest.mock('~utils/file-system', () => {
  // eslint-disable-next-line unicorn/prefer-module, @typescript-eslint/no-var-requires
  const path = require('node:path');
  return {
    getFilesRecursively: (...args: any[]) => mockGetFilesRecursively(...args),
    resolveOsPath: (basePath: string) => path.resolve(basePath),
  };
});
jest.mock('~utils/file-info', () => ({
  createFileInfo: (...args: any[]) => mockCreateFileInfo(...args),
}));
jest.mock('~utils/content-types', () => ({
  getKnownContentTypes: (...args: any[]) => mockGetKnownContentTypes(...args),
  testFileContentType: (...args: any[]) => mockTestFileContentType(...args),
}));

const publicDir = '/public';

describe('createManifestFileMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should create manifest with known content types', () => {
    expect.assertions(6);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: [],
      ignoreDotFiles: true,
      ignoreWellKnown: true,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    const files = [path.resolve('./public/index.html'), path.resolve('./public/data.json')];
    mockGetFilesRecursively.mockReturnValue(files);
    mockGetKnownContentTypes.mockReturnValue([
      { contentType: 'text/html' },
      { contentType: 'application/json' },
    ]);
    mockTestFileContentType.mockImplementation((types, assetKey) => {
      if (assetKey.endsWith('.html')) return { contentType: 'text/html' };
      if (assetKey.endsWith('.json')) return { contentType: 'application/json' };
      return null;
    });
    mockCreateFileInfo.mockImplementation((assetKey, publicDir) => ({
      size: 123,
      hash: 'abc123',
      lastModifiedTime: 111111,
      assetPath: `.${path.join(publicDir, assetKey)}`,
    }));

    const manifest = createManifestFileMap(config);

    const publicDirPath = path.resolve(`./${config.publicDir}`);

    expect(mockColorLog).toHaveBeenCalledWith(
      'info',
      expect.stringContaining(`Using ${publicDirPath} as public directory`),
    );
    expect(mockColorLog).toHaveBeenCalledWith('info', 'Removed dot files (default behavior)');
    expect(mockColorLog).toHaveBeenCalledWith(
      'warning',
      'Ignored .well-known (This may cause issues with web manifests, etc.)',
    );
    expect(mockColorLog).toHaveBeenCalledWith('info', 'Creating build manifest...');

    expect(manifest['/index.html']).toMatchObject({
      assetKey: '/index.html',
      contentType: 'text/html',
      fileInfo: expect.any(Object),
      lastModifiedTime: 111111,
      type: 'wasm-inline',
    });
    expect(manifest['/data.json']).toMatchObject({
      assetKey: '/data.json',
      contentType: 'application/json',
      fileInfo: expect.any(Object),
      lastModifiedTime: 111111,
      type: 'wasm-inline',
    });
  });

  it('should default to application/octet-stream for unknown content types', () => {
    expect.assertions(2);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: [],
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    const files = [path.resolve('./public/unknown.bin')];
    mockGetFilesRecursively.mockReturnValue(files);
    mockGetKnownContentTypes.mockReturnValue([]);
    mockTestFileContentType.mockReturnValue(null);
    mockCreateFileInfo.mockReturnValue({
      size: 1,
      hash: 'deadbeef',
      lastModifiedTime: 222222,
      assetPath: './public/unknown.bin',
    });

    const manifest = createManifestFileMap(config);

    expect(mockColorLog).toHaveBeenCalledWith(
      'caution',
      expect.stringContaining('Unknown content type for /unknown.bin'),
    );
    expect(manifest['/unknown.bin']).toMatchObject({
      assetKey: '/unknown.bin',
      contentType: 'application/octet-stream',
      fileInfo: expect.any(Object),
      lastModifiedTime: 222222,
      type: 'wasm-inline',
    });
  });

  it('should log ignored directories', () => {
    expect.assertions(3);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: ['/public/ignore1', '/public/ignore2'],
      ignoreDotFiles: true,
      ignoreWellKnown: true,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    mockGetFilesRecursively.mockReturnValue([]);
    mockGetKnownContentTypes.mockReturnValue([]);
    mockTestFileContentType.mockReturnValue(null);

    createManifestFileMap(config);

    expect(mockColorLog).toHaveBeenCalledWith('info', 'Ignoring directories:');
    expect(mockColorLog).toHaveBeenCalledWith('info', '    - /public/ignore1');
    expect(mockColorLog).toHaveBeenCalledWith('info', '    - /public/ignore2');
  });

  it('should handle empty files array', () => {
    expect.assertions(1);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: [],
      ignoreDotFiles: true,
      ignoreWellKnown: true,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    mockGetFilesRecursively.mockReturnValue([]);
    mockGetKnownContentTypes.mockReturnValue([]);
    mockTestFileContentType.mockReturnValue(null);

    const manifest = createManifestFileMap(config);

    expect(manifest).toStrictEqual({});
  });

  it('should handle multiple files and ignore paths', () => {
    expect.assertions(3);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: ['/public/ignore'],
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    const files = [path.resolve('./public/file1.txt'), path.resolve('./public/file2.txt')];
    mockGetFilesRecursively.mockReturnValue(files);
    mockGetKnownContentTypes.mockReturnValue([{ contentType: 'text/plain' }]);
    mockTestFileContentType.mockImplementation(() => ({
      contentType: 'text/plain',
    }));
    mockCreateFileInfo.mockImplementation((assetKey, publicDir) => ({
      size: 10,
      hash: 'hash',
      lastModifiedTime: 333333,
      assetPath: `.${path.join(publicDir, assetKey)}`,
    }));

    const manifest = createManifestFileMap(config);

    expect(Object.keys(manifest)).toHaveLength(2);
    expect(manifest['/file1.txt']).toMatchObject({
      assetKey: '/file1.txt',
      contentType: 'text/plain',
      fileInfo: expect.any(Object),
      lastModifiedTime: 333333,
      type: 'wasm-inline',
    });
    expect(manifest['/file2.txt']).toMatchObject({
      assetKey: '/file2.txt',
      contentType: 'text/plain',
      fileInfo: expect.any(Object),
      lastModifiedTime: 333333,
      type: 'wasm-inline',
    });
  });

  it('should call getFilesRecursively with correct options', () => {
    expect.assertions(1);
    const config: AssetCacheConfig = {
      publicDir,
      ignorePaths: ['/public/ignore'],
      ignoreDotFiles: true,
      ignoreWellKnown: false,
      contentTypes: [],
      assetManifestPath: 'unused/output/path',
    };

    mockGetFilesRecursively.mockReturnValue([]);
    mockGetKnownContentTypes.mockReturnValue([]);
    mockTestFileContentType.mockReturnValue(null);

    createManifestFileMap(config);

    expect(mockGetFilesRecursively).toHaveBeenCalledWith(path.resolve('./public'), {
      ignoreDirs: config.ignorePaths,
      ignoreDotFiles: config.ignoreDotFiles,
      ignoreWellKnown: config.ignoreWellKnown,
    });
  });
});
