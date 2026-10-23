import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import { componentNew } from '@bytecodealliance/jco-transpile/wasm-tools';

import { addWasmMetadata } from '~componentize/add-wasm-metadata.ts';
import { componentize } from '~componentize/componentize.ts';
import {
  composeComponents,
  restoreEngineBindings,
  spliceImports,
} from '~componentize/components.ts';
import { getJsInputContents } from '~componentize/get-js-input.ts';
import { precompile } from '~componentize/precompile.ts';

import { validateFileExists } from '~utils/input-path-verification.ts';

jest.mock('~utils/file-system');
jest.mock('~utils/npx-path');
jest.mock('node:fs', () => ({
  rmSync: jest.fn(),
}));
jest.mock('node:child_process', () => ({
  spawnSync: jest.fn().mockReturnValueOnce({ status: 0 }).mockReturnValue({ status: 1 }),
}));
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockReturnValueOnce('generated_binary').mockReturnValueOnce('preview_wasm'),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));
jest.mock('~componentize/get-js-input', () => ({
  getJsInputContents: jest.fn().mockReturnValue('{_user_provided_js_content_}'),
}));

// This is just mocked here.. Integration tests from fastedge-build will test this in detail
jest.mock('~utils/input-path-verification', () => ({
  validateFileExists: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

jest.mock('~componentize/precompile', () => ({
  precompile: jest.fn().mockReturnValue('{_precompiled_application_}'),
}));

jest.mock('~componentize/add-wasm-metadata', () => ({
  addWasmMetadata: jest.fn(),
}));

const loaded = { interfaces: ['acme:x/y'], binaries: [] };
jest.mock('~componentize/components', () => ({
  loadComponents: jest.fn().mockResolvedValue({ interfaces: ['acme:x/y'], binaries: [] }),
  importWorld: jest.fn().mockResolvedValue('world app {}'),
  spliceImports: jest.fn().mockResolvedValue({
    engine: 'temp_root/spliced-engine.wasm',
    input: '--initializer-script-path temp_root/initializer.js temp_root/source.js',
    env: { SOURCE_NAME: 'source.js', IMPORT_CNT: '1' },
  }),
  restoreEngineBindings: jest.fn().mockResolvedValue('restored_binary'),
  composeComponents: jest.fn().mockResolvedValue('composed_component_wasm'),
}));

jest.mock('@bytecodealliance/wizer', () => ({ __esModule: true, default: 'wizer' }));

jest.mock('@bytecodealliance/jco-transpile/wasm-tools', () => ({
  componentNew: jest.fn().mockResolvedValue('complete_generated_component_wasm'),
}));

describe('componentize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should handle componentization process correctly', async () => {
    expect.assertions(10);
    await componentize('input.js', 'output.wasm');

    expect(validateFileExists).toHaveBeenCalledWith('root_dir/lib/fastedge-runtime.wasm');
    expect(getJsInputContents).toHaveBeenCalledWith('input.js', true, []);
    expect(precompile).toHaveBeenCalledWith('{_user_provided_js_content_}');
    expect(spawnSync).toHaveBeenCalledWith(
      'wizer',
      [
        '--allow-wasi',
        '--wasm-bulk-memory=true',
        '--wasm-reference-types=true',
        '--inherit-env=true',
        '--dir=.',
        '--dir=temp_root',
        '-r',
        '_start=wizer.resume',
        '-o=output.wasm',
        'root_dir/lib/fastedge-runtime.wasm',
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: 'temp_root/temp.bundle.js',
        encoding: 'utf-8',
        env: {
          ENABLE_PBL: '0',
          // ...process.env,
        },
      },
    );

    expect(rmSync).toHaveBeenCalledWith('tmp_dir', { recursive: true });
    expect(readFile).toHaveBeenNthCalledWith(1, 'output.wasm');
    expect(readFile).toHaveBeenNthCalledWith(2, 'root_dir/lib/preview1-adapter.wasm');

    expect(componentNew).toHaveBeenCalledWith('generated_binary', [
      ['wasi_snapshot_preview1', 'preview_wasm'],
    ]);

    expect(writeFile).toHaveBeenCalledWith('output.wasm', 'complete_generated_component_wasm');
    expect(addWasmMetadata).toHaveBeenCalledTimes(1);
  });

  it('should splice, wizer and compose when components are given', async () => {
    expect.assertions(7);
    (spawnSync as jest.Mock).mockReturnValueOnce({ status: 0 });
    (readFile as jest.Mock)
      .mockResolvedValueOnce('generated_binary')
      .mockResolvedValueOnce('preview_wasm');
    await componentize('input.js', 'output.wasm', { components: { 'acme:x/y': './c.wasm' } });

    expect(getJsInputContents).toHaveBeenCalledWith('input.js', true, ['acme:x/y']);
    expect(precompile).toHaveBeenCalledWith('{_user_provided_js_content_}', undefined, 'module');
    expect(spliceImports).toHaveBeenCalledWith(
      'root_dir/lib/fastedge-runtime.wasm',
      'world app {}',
      '{_precompiled_application_}',
      'tmp_dir',
    );
    expect(spawnSync).toHaveBeenCalledWith(
      'wizer',
      [
        '--allow-wasi',
        '--wasm-bulk-memory=true',
        '--wasm-reference-types=true',
        '--inherit-env=true',
        '--dir=.',
        '--dir=temp_root',
        '--init-func',
        'componentize.wizer',
        '-o=output.wasm',
        'temp_root/spliced-engine.wasm',
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: '--initializer-script-path temp_root/initializer.js temp_root/source.js',
        encoding: 'utf-8',
        env: { ENABLE_PBL: '0', SOURCE_NAME: 'source.js', IMPORT_CNT: '1' },
      },
    );
    expect(restoreEngineBindings).toHaveBeenCalledWith(
      'root_dir/lib/fastedge-runtime.wasm',
      'generated_binary',
    );
    expect(componentNew).toHaveBeenCalledWith('restored_binary', [
      ['wasi_snapshot_preview1', 'preview_wasm'],
    ]);
    expect(composeComponents).toHaveBeenCalledWith('complete_generated_component_wasm', loaded);
  });

  it('should exit process if wizer fails during process', async () => {
    expect.assertions(2);
    const mockProcessExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        jest.fn() as unknown as (code?: string | number | null | undefined) => never,
      );
    await componentize('input.js', 'output.wasm');

    expect(spawnSync).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything());
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockProcessExit.mockRestore();
  });

  it('should use FASTEDGE_WIZER_PATH as the wizer binary when set', async () => {
    expect.assertions(1);
    const mockProcessExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        jest.fn() as unknown as (code?: string | number | null | undefined) => never,
      );
    process.env.FASTEDGE_WIZER_PATH = '/opt/wizer';
    try {
      await componentize('input.js', 'output.wasm');

      expect(spawnSync).toHaveBeenCalledWith('/opt/wizer', expect.anything(), expect.anything());
    } finally {
      delete process.env.FASTEDGE_WIZER_PATH;
      mockProcessExit.mockRestore();
    }
  });
});
