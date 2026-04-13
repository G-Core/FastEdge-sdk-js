import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylisticPlugin from '@stylistic/eslint-plugin';
import importXPlugin from 'eslint-plugin-import-x';
import jestPlugin from 'eslint-plugin-jest';
import unicornPlugin from 'eslint-plugin-unicorn';
import testingLibrary from 'eslint-plugin-testing-library';

import formattingRules from './config/eslint/repo/rules/baseFormattingRules.js';
import logicRules from './config/eslint/repo/rules/baseLogicRules.js';
import styleRules from './config/eslint/repo/rules/baseStyleRules.js';
import importRules from './config/eslint/repo/rules/importPlugin.js';
import jestRules from './config/eslint/repo/rules/jestPlugin.js';
import testingLibRules from './config/eslint/repo/rules/testingLibraryPlugin.js';
import unicornRules from './config/eslint/repo/rules/unicornPlugin.js';

export default [
  // 1. Global ignores (replaces ignorePatterns)
  {
    ignores: [
      '**/node_modules/**',
      'config/eslint/**',
      'config/jest/**',
      'docs/**',
      'esbuild/**',
      'dist/**',
      'build/**',
      '**/build/**',
      'types/**',
      'integration-tests/**',
      'bin/**',
      'lib/**',
      '**/runtime/fastedge/**',
      '**/runtime/StarlingMonkey/**',
      'github-pages/**',
      'eslint.config.js',
      '.github/**',
      '.releaserc.cjs',
      'examples/react-with-hono-server/**',
    ],
  },

  // 2. TypeScript-ESLint recommended (includes parser setup)
  ...tseslint.configs.recommended,

  // 3. Base config for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        global: 'readonly',
        process: 'readonly',
        fastedge: 'readonly',
      },
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    plugins: {
      '@stylistic': stylisticPlugin,
      'import-x': importXPlugin,
      unicorn: unicornPlugin,
    },
    settings: {
      ...importRules.settings,
    },
    rules: {
      ...logicRules.rules,
      ...styleRules.rules,
      ...formattingRules.rules,
      ...importRules.rules,
      ...unicornRules.rules,
      // Override tseslint recommended: allow ternary and short-circuit expressions as statements
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: false,
          enforceForJSX: true,
        },
      ],
    },
  },

  // 4. Test file overrides
  {
    files: ['**/*.{spec,test}.{js,jsx,ts,tsx}'],
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibrary,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        jsdom: 'readonly',
      },
    },
    settings: {
      jest: jestRules.settings.jest,
    },
    rules: {
      ...jestRules.rules,
      ...testingLibRules.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 5. Examples override — relaxed rules
  {
    files: ['examples/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        FetchEvent: 'readonly',
      },
    },
    rules: {
      'import-x/extensions': 'off',
      'import-x/group-exports': 'off',
      'import-x/exports-last': 'off',
      'import-x/no-default-export': 'off',
      'import-x/unambiguous': 'off',
      'no-console': 'off',
      'prefer-destructuring': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 6. Type definition files override
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'no-undef': ['error', { typeof: false }],
    },
  },
];
