import { readFileSync } from 'node:fs';

import { injectJSBuiltins } from '~src//inject-js-builtins';

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(() => 'JS_INTERNALS'),
}));

describe('injectJSBuiltins', () => {
  it('should inject JS internals into given user js bundle', () => {
    expect.assertions(1);
    const usersJS = 'USERS_JS_BUNDLE';
    const result = injectJSBuiltins(usersJS);

    expect(result).toBe(`;{\n// Precompiled JS builtins\nJS_INTERNALS}\nUSERS_JS_BUNDLE`);
  });

  it('should call readFileSync with correct path to js-builtins', () => {
    expect.assertions(1);
    const originalContents = 'original contents';
    injectJSBuiltins(originalContents);

    // Verify that readFileSync is called with the correct path and encoding
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('/lib/js-builtins.js'),
      'utf8',
    );
  });
});
