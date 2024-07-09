import { readFile } from 'node:fs/promises';

import { esBundle } from './es-bundle';
import { getJsInputContents } from './get-js-input';

jest.mock('node:fs/promises');

jest.mock('./es-bundle', () => ({
  esBundle: jest.fn().mockResolvedValue('bundled_js_content'), // Mock the pre-bundle module's function
}));

describe('get-js-input - get javascript input contents as a string', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock function calls after each test
  });
  it('should call our pre-bundling esbuild correctly', async () => {
    expect.assertions(3);
    const contents = await getJsInputContents('input.js', true);
    expect(esBundle).toHaveBeenCalledWith('input.js');
    expect(readFile).not.toHaveBeenCalled();
    expect(contents).toBe('bundled_js_content');
  });
  it('should just read the provided js into contents', async () => {
    expect.assertions(3);
    readFile.mockResolvedValue('provided_js_content');
    const contents = await getJsInputContents('input.js', false);
    expect(readFile).toHaveBeenCalledWith('input.js', 'utf8');
    expect(esBundle).not.toHaveBeenCalled();
    expect(contents).toBe('provided_js_content');
  });
});
