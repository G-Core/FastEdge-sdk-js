import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { createStaticAssetsManifest } from '../create-manifest.ts';

import type { AssetCacheConfig, StaticAssetManifest } from '../types.ts';

const publicDir = '/public';

// Mocks
const mockCreateManifestFileMap = jest.fn();
const mockIsFile = jest.fn();
const mockCreateOutputDirectory = jest.fn();
const mockColorLog = jest.fn();
const mockNormalizeConfig = jest.fn();

jest.mock('../create-manifest-file-map', () => ({
  createManifestFileMap: (...args: any[]) => mockCreateManifestFileMap(...args),
}));
jest.mock('~utils/file-system', () => {
  // eslint-disable-next-line unicorn/prefer-module, @typescript-eslint/no-require-imports
  const path = require('node:path');
  return {
    createOutputDirectory: (...args: any[]) => mockCreateOutputDirectory(...args),
    isFile: (...args: any[]) => mockIsFile(...args),
    resolveOsPath: (basePath: string) => path.resolve(basePath),
  };
});
jest.mock('~utils/color-log', () => ({
  colorLog: (...args: any[]) => mockColorLog(...args),
}));
jest.mock('~utils/config-helpers', () => ({
  normalizeConfig: (...args: any[]) => mockNormalizeConfig(...args),
}));

jest.mock('node:fs', () => ({
  writeFileSync: jest.fn(),
}));

const DEFAULT_ASSET_MANIFEST_PATH = '/.fastedge/build/static-asset-manifest.js';

describe('createStaticAssetsManifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create manifest file and return manifest object', async () => {
    expect.assertions(5);
    const config: Partial<AssetCacheConfig> = {
      publicDir,
      ignoreDotFiles: true,
    };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: true,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '',
    };
    const manifest: StaticAssetManifest = {
      '/index.html': {
        assetKey: '/index.html',
        contentType: 'text/html',
      } as any,
      '/data.json': {
        assetKey: '/data.json',
        contentType: 'application/json',
      } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_ASSET_MANIFEST_PATH}`);

    const result = await createStaticAssetsManifest(config);

    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(mockNormalizeConfig).toHaveBeenCalledWith(config, expect.any(Object));
    expect(mockCreateManifestFileMap).toHaveBeenCalledWith(normalizedConfig);

    // Check manifest file contents
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should use provided assetManifestPath if it is a file', async () => {
    expect.assertions(4);
    const config: Partial<AssetCacheConfig> = {
      publicDir,
      assetManifestPath: '/custom/path/manifest.js',
    };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '/custom/path/manifest.js',
    };
    const manifest: StaticAssetManifest = {
      '/foo.txt': { assetKey: '/foo.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);
    mockIsFile.mockResolvedValue(true);

    const expectedManifestBuildOutput = path.resolve(`.${config.assetManifestPath}`);

    const result = await createStaticAssetsManifest(config);

    expect(mockIsFile).toHaveBeenCalledWith(config.assetManifestPath, true);
    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should ensure assetManifestPath has a js extension if it is not provided', async () => {
    expect.assertions(4);
    const config: Partial<AssetCacheConfig> = {
      publicDir,
      assetManifestPath: '/custom/path/manifest',
    };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '/custom/path/manifest',
    };
    const manifest: StaticAssetManifest = {
      '/foo.txt': { assetKey: '/foo.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);
    mockIsFile.mockResolvedValue(true);

    const expectedManifestBuildOutput = path.resolve(`.${config.assetManifestPath}.js`);

    const result = await createStaticAssetsManifest(config);

    expect(mockIsFile).toHaveBeenCalledWith(`${config.assetManifestPath}.js`, true);
    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should fallback to default assetManifestPath if provided assetManifestPath is not a file', async () => {
    expect.assertions(5);
    const config: Partial<AssetCacheConfig> = {
      publicDir,
      assetManifestPath: '/not/a/file.js',
    };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '/not/a/file',
    };
    const manifest: StaticAssetManifest = {
      '/bar.txt': { assetKey: '/bar.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);
    mockIsFile.mockResolvedValue(false);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_ASSET_MANIFEST_PATH}`);

    const result = await createStaticAssetsManifest(config);

    expect(mockIsFile).toHaveBeenCalledWith(config.assetManifestPath, true);
    expect(mockColorLog).toHaveBeenCalledWith('warning', expect.stringContaining('is not a file'));
    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should write a module that evaluates to the manifest, whatever the file names', async () => {
    expect.assertions(1);
    const config: Partial<AssetCacheConfig> = { publicDir };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '',
    };
    // Quote, backslash, newline, template and comment syntax: none may break out of the literal
    // eslint-disable-next-line no-template-curly-in-string -- a literal `${` is part of the test
    const tricky = "/x'+globalThis.PWNED=1+'\\a\nb`${1}`*/.txt";
    const manifest: StaticAssetManifest = {
      '/foo.txt': { assetKey: '/foo.txt', contentType: 'text/plain' } as any,
      [tricky]: {
        assetKey: tricky,
        contentType: 'text/plain',
        fileInfo: { assetPath: `./public${tricky}`, size: 1 },
      } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    await createStaticAssetsManifest(config);

    const contents = (writeFileSync as jest.Mock).mock.calls[0][1] as string;
    // eslint-disable-next-line no-new-func -- evaluating the generated module is the point of the test
    const evaluated = new Function(
      contents.replace('export { staticAssetManifest };', 'return staticAssetManifest;'),
    )();

    expect(evaluated).toStrictEqual(manifest);
  });

  it('should handle empty manifest gracefully', async () => {
    expect.assertions(2);
    const config: Partial<AssetCacheConfig> = { publicDir };
    const normalizedConfig: AssetCacheConfig = {
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '',
    };
    const manifest: StaticAssetManifest = {};

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_ASSET_MANIFEST_PATH}`);

    const result = await createStaticAssetsManifest(config);

    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toStrictEqual({});
  });

  it('should use default output path if not specified', async () => {
    expect.assertions(1);
    const config: Partial<AssetCacheConfig> = {};
    const normalizedConfig: AssetCacheConfig = {
      publicDir: '',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '',
    };
    const manifest: StaticAssetManifest = {};

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_ASSET_MANIFEST_PATH}`);

    await createStaticAssetsManifest(config);

    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
  });

  it('should pass correct normalization schema to normalizeConfig', async () => {
    expect.assertions(1);
    const config: Partial<AssetCacheConfig> = { publicDir };
    mockNormalizeConfig.mockReturnValue({
      publicDir,
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      assetManifestPath: '',
    });

    mockCreateManifestFileMap.mockResolvedValue({});

    await createStaticAssetsManifest(config);

    expect(mockNormalizeConfig).toHaveBeenCalledWith(
      config,
      expect.objectContaining({
        ignoreDotFiles: 'booleanTruthy',
        ignoreWellKnown: 'booleanFalsy',
        ignorePaths: 'pathsArray',
        publicDir: 'path',
        contentTypes: 'array',
        assetManifestPath: 'path',
      }),
    );
  });
});
