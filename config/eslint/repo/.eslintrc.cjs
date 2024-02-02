const ban = require('./rules/banPlugin.cjs');
const formatting = require('./rules/baseFormattingRules.cjs');
const logic = require('./rules/baseLogicRules.cjs');
const style = require('./rules/baseStyleRules.cjs');
// // Plugin configs
const importPlugin = require('./rules/importPlugin.cjs');
const jest = require('./rules/jestPlugin.cjs');
const testingLib = require('./rules/testingLibraryPlugin.cjs');
const unicorn = require('./rules/unicornPlugin.cjs');

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  globals: {
    global: 'readonly',
    process: 'readonly',
    fastedge: 'readonly',
  },
  ignorePatterns: [
    '**/node_modules/**',
    'config/eslint/repo/rules/**',
    'config/jest/**',
    'docs/**',
    'esbuild/**',
    'dist/**',
    'lib/**',
    '**/fastedge-runtime/cbindings/**',
    '**/fastedge-runtime/spidermonkey/**',
    '/componentize.js',
    '/componentize-cli.js',
  ],
  plugins: [
    ...ban.plugins,
    ...importPlugin.plugins,
    ...jest.plugins,
    ...testingLib.plugins,
    ...unicorn.plugins,
  ],
  settings: {
    ...ban.settings,
    ...importPlugin.settings,
    ...jest.settings,
    ...testingLib.settings,
    ...unicorn.settings,
  },
  rules: {
    // "n/exports-style": ["error", "module.exports"],
    ...logic.rules,
    ...style.rules,
    ...formatting.rules,
    ...ban.rules,
    ...importPlugin.rules,
    ...jest.rules,
    ...testingLib.rules,
    ...unicorn.rules,
  },
  overrides: [
    ...ban.overrides,
    ...testingLib.overrides,
    ...jest.overrides,
    {
      files: ['**/*.d.ts'],
      rules: {
        // Want to define set numbers as prop values
        '@typescript-eslint/no-magic-numbers': 'off',
        'no-undef': ['error', { typeof: false }],
      },
    },
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};
