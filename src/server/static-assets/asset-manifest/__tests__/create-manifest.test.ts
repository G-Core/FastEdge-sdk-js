import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { createStaticAssetsManifest } from '../create-manifest.ts';

import type { AssetCacheConfig, StaticAssetManifest } from '../types.ts';

// Mocks
const mockCreateManifestFileMap = jest.fn();
const mockIsFile = jest.fn();
const mockPrettierObjectString = jest.fn();
const mockCreateOutputDirectory = jest.fn();
const mockColorLog = jest.fn();
const mockNormalizeConfig = jest.fn();

jest.mock('../create-manifest', () => ({
  createManifestFileMap: (...args: any[]) => mockCreateManifestFileMap(...args),
  prettierObjectString: (...args: any[]) => mockPrettierObjectString(...args),
}));
jest.mock('~utils/file-system', () => {
  // eslint-disable-next-line unicorn/prefer-module, @typescript-eslint/no-var-requires
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

const DEFAULT_OUTPUT_PATH = '/.fastedge/build/static-asset-manifest.js';

describe('createStaticAssetsManifest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrettierObjectString.mockImplementation((obj) => JSON.stringify(obj));
  });

  it('should create manifest file and return manifest object', async () => {
    expect.assertions(5);
    const config: Partial<AssetCacheConfig> = {
      inputPath: '/public',
      ignoreDotFiles: true,
    };
    const normalizedConfig: AssetCacheConfig = {
      inputPath: '/public',
      ignoreDotFiles: true,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '',
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

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_OUTPUT_PATH}`);

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

  it('should use provided outputPath if it is a file', async () => {
    expect.assertions(4);
    const config: Partial<AssetCacheConfig> = {
      inputPath: '/public',
      outputPath: '/custom/path/manifest.js',
    };
    const normalizedConfig: AssetCacheConfig = {
      inputPath: '/public',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '/custom/path/manifest.js',
    };
    const manifest: StaticAssetManifest = {
      '/foo.txt': { assetKey: '/foo.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);
    mockIsFile.mockResolvedValue(true);

    const expectedManifestBuildOutput = path.resolve(`.${config.outputPath}`);

    const result = await createStaticAssetsManifest(config);

    expect(mockIsFile).toHaveBeenCalledWith(config.outputPath, true);
    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should fallback to default outputPath if provided outputPath is not a file', async () => {
    expect.assertions(5);
    const config: Partial<AssetCacheConfig> = {
      inputPath: '/public',
      outputPath: '/not/a/file',
    };
    const normalizedConfig: AssetCacheConfig = {
      inputPath: '/public',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '/not/a/file',
    };
    const manifest: StaticAssetManifest = {
      '/bar.txt': { assetKey: '/bar.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);
    mockIsFile.mockResolvedValue(false);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_OUTPUT_PATH}`);

    const result = await createStaticAssetsManifest(config);

    expect(mockIsFile).toHaveBeenCalledWith(config.outputPath, true);
    expect(mockColorLog).toHaveBeenCalledWith('warning', expect.stringContaining('is not a file'));
    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedManifestBuildOutput,
      expect.stringContaining('const staticAssetManifest = {'),
    );
    expect(result).toBe(manifest);
  });

  it('should format manifest entries with prettierObjectString', async () => {
    expect.assertions(4);
    const config: Partial<AssetCacheConfig> = { inputPath: '/public' };
    const normalizedConfig: AssetCacheConfig = {
      inputPath: '/public',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '',
    };
    const manifest: StaticAssetManifest = {
      '/foo.txt': { assetKey: '/foo.txt', contentType: 'text/plain' } as any,
      '/bar.txt': { assetKey: '/bar.txt', contentType: 'text/plain' } as any,
    };

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    await createStaticAssetsManifest(config);

    expect(mockPrettierObjectString).toHaveBeenCalledWith(manifest['/foo.txt']);
    expect(mockPrettierObjectString).toHaveBeenCalledWith(manifest['/bar.txt']);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("'/foo.txt':"),
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("'/bar.txt':"),
    );
  });

  it('should handle empty manifest gracefully', async () => {
    expect.assertions(2);
    const config: Partial<AssetCacheConfig> = { inputPath: '/public' };
    const normalizedConfig: AssetCacheConfig = {
      inputPath: '/public',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '',
    };
    const manifest: StaticAssetManifest = {};

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_OUTPUT_PATH}`);

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
      inputPath: '',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '',
    };
    const manifest: StaticAssetManifest = {};

    mockNormalizeConfig.mockReturnValue(normalizedConfig);
    mockCreateManifestFileMap.mockResolvedValue(manifest);

    const expectedManifestBuildOutput = path.resolve(`.${DEFAULT_OUTPUT_PATH}`);

    await createStaticAssetsManifest(config);

    expect(mockCreateOutputDirectory).toHaveBeenCalledWith(expectedManifestBuildOutput);
  });

  it('should pass correct normalization schema to normalizeConfig', async () => {
    expect.assertions(1);
    const config: Partial<AssetCacheConfig> = { inputPath: '/public' };
    mockNormalizeConfig.mockReturnValue({
      inputPath: '/public',
      ignoreDotFiles: false,
      ignoreWellKnown: false,
      ignorePaths: [],
      contentTypes: [],
      outputPath: '',
    });

    mockCreateManifestFileMap.mockResolvedValue({});

    await createStaticAssetsManifest(config);

    expect(mockNormalizeConfig).toHaveBeenCalledWith(
      config,
      expect.objectContaining({
        ignoreDotFiles: 'booleanTruthy',
        ignoreWellKnown: 'booleanFalsy',
        ignorePaths: 'pathsArray',
        inputPath: 'path',
        contentTypes: 'string',
        outputPath: 'path',
      }),
    );
  });
});
