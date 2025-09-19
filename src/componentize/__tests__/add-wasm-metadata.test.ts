import { readFile, writeFile } from 'node:fs/promises';

import { metadataAdd } from '@bytecodealliance/jco';

import { addWasmMetadata } from '~componentize/add-wasm-metadata.ts';

jest.mock('~utils/npx-path.ts');
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest
    .fn()
    .mockReturnValueOnce(
      JSON.stringify({
        name: 'mock-test-package',
        version: '1.3.1',
      }),
    )
    .mockReturnValueOnce('input_wasm_file_contents'),
}));

jest.mock('@bytecodealliance/jco', () => ({
  metadataAdd: jest.fn().mockReturnValueOnce('new_wasm_file'),
}));

describe('add-wasm-metadata', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock function calls after each test
  });
  it('should read the package.json and add metadata to the wasm file', async () => {
    expect.assertions(4);
    const inputPath = 'dist/test.wasm';
    await addWasmMetadata(inputPath);
    expect(readFile).toHaveBeenCalledWith('root_dir/package.json', { encoding: 'utf-8' });
    expect(readFile).toHaveBeenCalledWith(inputPath);
    expect(metadataAdd).toHaveBeenCalledWith('input_wasm_file_contents', [
      ['processed-by', [['mock-test-package', '1.3.1']]],
    ]);
    expect(writeFile).toHaveBeenCalledWith(inputPath, 'new_wasm_file');
  });
});
