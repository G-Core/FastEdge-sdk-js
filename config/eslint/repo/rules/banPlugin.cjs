module.exports = {
  plugins: ['ban'],
  settings: {},
  rules: {},
  overrides: [
    {
      files: ['*.{spec,test}.{js,jsx,ts,tsx}'],
      plugins: ['ban'],
      globals: { jsdom: 'readonly' },
      // env: { jest: true, "jest/globals": true, node: true },
      env: { jest: true, node: true },
      rules: {
        'ban/ban': [
          'error',
          {
            name: ['expect', 'hasAssertions'],
            message: 'Please use `expect.assertions(n)` instead of `expect.hasAssertions()`.',
          },
        ],
      },
    },
  ],
};
