export default {
  settings: {
    'import-x/ignore': ['node_modules'],
    'import-x/resolver': { node: { extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx', '.md'] } },
  },
  rules: {
    // Ensure a default export is present, given a default import
    'import-x/default': 'error',
    // Enforce a leading comment with the webpackChunkName for dynamic imports
    'import-x/dynamic-import-chunkname': [
      'error',
      { importFunctions: [], webpackChunknameFormat: '.*' },
    ],
    // Report any invalid exports, i.e. re-export of the same name
    'import-x/export': 'error',
    // Ensure all exports appear after other statements
    'import-x/exports-last': 'error',
    // Ensure consistent use of file extension within the import path
    'import-x/extensions': [
      'error',
      {
        js: 'never',
        jsx: 'never',
        ts: 'always',
        tsx: 'always',
        css: 'always',
        json: 'always',
        png: 'always',
        md: 'always',
      },
    ],
    // Ensure all imports appear before other statements
    'import-x/first': 'error',
    // Prefer named exports to be grouped together in a single export declaration
    'import-x/group-exports': 'error',
    // Limit the maximum number of dependencies a module can have
    'import-x/max-dependencies': ['off', { max: 10, ignoreTypeImports: true }],
    // Ensure named imports correspond to a named export in the remote file
    'import-x/named': 'error',
    // Ensure imported namespaces contain dereferenced properties as they are dereferenced
    'import-x/namespace': ['error', { allowComputed: false }],
    // Enforce a newline after import statements
    'import-x/newline-after-import': 'error',
    // Report AMD `require` and `define` calls
    'import-x/no-amd': 'error',
    // Forbid anonymous values as default exports
    'import-x/no-anonymous-default-export': [
      'error',
      {
        allowArray: false,
        allowArrowFunction: false,
        allowAnonymousClass: false,
        allowAnonymousFunction: false,
        allowCallExpression: true,
        allowLiteral: false,
        allowObject: false,
      },
    ],
    // Forbid import of modules using absolute paths
    'import-x/no-absolute-path': ['error', { esmodule: true, commonjs: true, amd: false }],
    // Report CommonJS `require` calls and `module.exports` or `exports.*`
    'import-x/no-commonjs': [
      'off',
      { allowRequire: true, allowConditionalRequire: true, allowPrimitiveModules: true },
    ],
    // Forbid a module from importing a module with a dependency path back to itself
    'import-x/no-cycle': [
      'error',
      { commonjs: false, amd: false, maxDepth: Infinity, ignoreExternal: true },
    ],
    // Forbid default exports
    'import-x/no-default-export': 'error',
    // Report imported names marked with `@deprecated` documentation tag
    'import-x/no-deprecated': 'warn',
    // Report repeated `import` of the same module in multiple places
    'import-x/no-duplicates': ['error', { considerQueryString: true }],
    // Forbid `require()` calls with expressions
    'import-x/no-dynamic-require': 'error',
    // Forbid the use of extraneous packages
    'import-x/no-extraneous-dependencies': [
      'off',
      {
        devDependencies: true,
        optionalDependencies: true,
        peerDependencies: true,
        bundledDependencies: true,
      },
    ],
    // Forbid imports with CommonJS exports
    'import-x/no-import-module-exports': ['error', { exceptions: [] }],
    // Prevent importing the submodules of other modules
    'import-x/no-internal-modules': ['off', { allow: [], forbid: [] }],
    // Forbid the use of mutable exports with `var` or `let`
    'import-x/no-mutable-exports': ['error'],
    // Forbid named default exports
    'import-x/no-named-default': 'error',
    // Forbid named exports
    'import-x/no-named-export': 'off',
    // Report use of exported name as identifier of default export
    'import-x/no-named-as-default': 'error',
    // Report use of exported name as property of default export
    'import-x/no-named-as-default-member': 'error',
    // Forbid namespace (a.k.a. "wildcard" `*`) imports
    'import-x/no-namespace': ['error', { ignore: [] }],
    // No Node.js builtin modules
    'import-x/no-nodejs-modules': ['off', { allow: ['fs', 'path'] }],
    // Prevent importing packages through relative paths
    'import-x/no-relative-packages': 'off',
    // Forbid importing modules from parent directories
    'import-x/no-relative-parent-imports': 'off',
    // Restrict which files can be imported in a given folder
    'import-x/no-restricted-paths': ['off', { zones: [], basePath: '.' }],
    // Forbid a module from importing itself
    'import-x/no-self-import': 'error',
    // Forbid unassigned imports
    'import-x/no-unassigned-import': [
      'error',
      {
        allow: [
          '**/commands',
          '**/*.css',
          '@testing-library/**',
          'cross-fetch/polyfill',
          'jest-fetch-mock',
          'setimmediate',
        ],
      },
    ],
    // Ensure imports point to a file/module that can be resolved
    'import-x/no-unresolved': ['off', { commonjs: false, amd: false }],
    // Report modules without exports, or exports without matching import in another module
    'import-x/no-unused-modules': [
      'off',
      { missingExports: false, unusedExports: true, src: [process.cwd()] },
    ],
    // Prevent unnecessary path segments in import and require statements
    'import-x/no-useless-path-segments': ['error', { noUselessIndex: false, commonjs: true }],
    // Forbid webpack loader syntax in imports
    'import-x/no-webpack-loader-syntax': 'error',
    // Enforce a convention in module import order
    'import-x/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
          'unknown',
        ],
        pathGroups: [],
        pathGroupsExcludedImportTypes: [],
        'newlines-between': 'always-and-inside-groups',
        alphabetize: { order: 'asc', caseInsensitive: true },
        warnOnUnassignedImports: true,
      },
    ],
    // Prefer a default export if module exports a single name
    'import-x/prefer-default-export': 'off',
    // Report potentially ambiguous parse goal (`script` vs. `module`)
    'import-x/unambiguous': 'error',
  },
};
