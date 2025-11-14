/* eslint-disable no-undef */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import { componentNew } from '@bytecodealliance/jco';

import { addWasmMetadata } from '~componentize/add-wasm-metadata.ts';
import { componentize } from '~componentize/componentize.ts';
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
    expect.assertions(10);
    await componentize('input.js', 'output.wasm');

    expect(validateFileExists).toHaveBeenCalledWith('root_dir/lib/fastedge-runtime.wasm');
    expect(getJsInputContents).toHaveBeenCalledWith('input.js', true);
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
        '-r _start=wizer.resume',
        '-o=output.wasm',
        'root_dir/lib/fastedge-runtime.wasm',
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: 'temp_root/temp.bundle.js',
        shell: true,
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
});
