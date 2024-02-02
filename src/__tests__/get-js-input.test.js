import { readFile } from 'node:fs/promises';

import { getJsInputContents } from '~src/get-js-input';
import { preBundle } from '~src/pre-bundle';

jest.mock('node:fs/promises');

jest.mock('~src/pre-bundle', () => ({
  preBundle: jest.fn().mockResolvedValue('bundled_js_content'), // Mock the pre-bundle module's function
}));

describe('get-js-input - get javascript input contents as a string', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock function calls after each test
  });
  it('should call our pre-bundling esbuild correctly', async () => {
    expect.assertions(3);
    const contents = await getJsInputContents('input.js', true);
    expect(preBundle).toHaveBeenCalledWith('input.js');
    expect(readFile).not.toHaveBeenCalled();
    expect(contents).toBe('bundled_js_content');
  });
  it('should just read the provided js into contents', async () => {
    expect.assertions(3);
    readFile.mockResolvedValue('provided_js_content');
    const contents = await getJsInputContents('input.js', false);
    expect(readFile).toHaveBeenCalledWith('input.js', 'utf8');
    expect(preBundle).not.toHaveBeenCalled();
    expect(contents).toBe('provided_js_content');
  });
});
