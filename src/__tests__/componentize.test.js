import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { componentNew } from '@bytecodealliance/jco';

import { addWasmMetadata } from '~src/add-wasm-metadata';
import { componentize } from '~src/componentize';
import { getJsInputContents } from '~src/get-js-input';
import { npxPackagePath, validateFilePaths } from '~src/input-verification';
import { precompile } from '~src/precompile';

jest.mock('node:child_process', () => ({
  spawnSync: jest.fn().mockReturnValueOnce({ status: 0 }).mockReturnValue({ status: 1 }),
}));
jest.mock('node:fs/promises', () => ({
  readFile: jest.fn().mockReturnValueOnce('generated_binary').mockReturnValueOnce('preview_wasm'),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));
jest.mock('~src/get-js-input', () => ({
  getJsInputContents: jest.fn().mockReturnValue('{_user_provided_js_content_}'),
}));

jest.mock('node:url', () => ({
  fileURLToPath: jest
    .fn()
    .mockReturnValueOnce('input.js')
    .mockReturnValueOnce('output.wasm')
    .mockReturnValue('./lib/wasi_snapshot_preview1.reactor.wasm'),
}));

// This is just mocked here.. Integration tests from componentize-cli will test this in detail
jest.mock('~src/input-verification', () => ({
  npxPackagePath: jest.fn().mockReturnValue('./lib/fastedge-runtime.wasm'),
  validateFilePaths: jest.fn().mockResolvedValue(),
}));

jest.mock('~src/precompile', () => ({
  precompile: jest.fn().mockReturnValue('{_precompiled_application_}'),
}));

jest.mock('~src/add-wasm-metadata', () => ({
  addWasmMetadata: jest.fn(),
}));

jest.mock('@bytecodealliance/wizer', () => 'wizer');

jest.mock('@bytecodealliance/jco', () => ({
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
    expect.assertions(9);
    await componentize('input.js', 'output.wasm');

    expect(fileURLToPath).toHaveBeenCalledTimes(3);
    expect(validateFilePaths).toHaveBeenCalledWith(
      'input.js',
      'output.wasm',
      './lib/fastedge-runtime.wasm',
    );

    expect(getJsInputContents).toHaveBeenCalledWith('input.js', true);
    expect(precompile).toHaveBeenCalledWith('{_user_provided_js_content_}');
    expect(spawnSync).toHaveBeenCalledWith(
      'wizer',
      [
        '--allow-wasi',
        '--wasm-bulk-memory=true',
        '--inherit-env=true',
        '--dir=/',
        '-r _start=wizer.resume',
        '-o=output.wasm',
        './lib/fastedge-runtime.wasm',
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: '/tmp/temp.bundle.js',
        shell: true,
        encoding: 'utf-8',
        env: {
          ENABLE_PBL: '0',
          ...process.env,
        },
      },
    );

    expect(readFile).toHaveBeenNthCalledWith(1, 'output.wasm');
    expect(readFile).toHaveBeenNthCalledWith(2, './lib/wasi_snapshot_preview1.reactor.wasm');

    expect(componentNew).toHaveBeenCalledWith('generated_binary', [
      ['wasi_snapshot_preview1', 'preview_wasm'],
    ]);

    expect(writeFile).toHaveBeenCalledWith('output.wasm', 'complete_generated_component_wasm');
  });

  it('should exit process if wizer fails during process', async () => {
    expect.assertions(2);
    const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(jest.fn());
    await componentize('input.js', 'output.wasm');

    expect(spawnSync).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything());
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockProcessExit.mockRestore();
  });
});
