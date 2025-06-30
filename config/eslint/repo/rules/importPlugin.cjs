module.exports = {
  settings: {
    'import/ignore': ['node_modules'],
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx', '.md'] } },
  },
  plugins: ['import'],
  rules: {
    // Ensure a default export is present, given a default import
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/default.md
    'import/default': 'error',
    // Enforce a leading comment with the webpackChunkName for dynamic imports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/dynamic-import-chunkname.md
    'import/dynamic-import-chunkname': [
      'error',
      { importFunctions: [], webpackChunknameFormat: '.*' },
    ],
    // Report any invalid exports, i.e. re-export of the same name
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/export.md
    'import/export': 'error',
    // Ensure all exports appear after other statements
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/exports-last.md
    'import/exports-last': 'error',
    // Ensure consistent use of file extension within the import path
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/extensions.md
    'import/extensions': [
      'error',
      {
        js: 'never',
        jsx: 'never',
        ts: 'always',
        tsx: 'never',
        css: 'always',
        json: 'always',
        png: 'always',
        md: 'always',
      },
    ],
    // Ensure all imports appear before other statements
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/first.md
    'import/first': 'error',
    // Prefer named exports to be grouped together in a single export declaration
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/group-exports.md
    'import/group-exports': 'error',
    // Limit the maximum number of dependencies a module can have
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/max-dependencies.md
    // Do not want to limit
    'import/max-dependencies': ['off', { max: 10, ignoreTypeImports: true }],
    // Ensure named imports correspond to a named export in the remote file
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/named.md
    'import/named': 'error',
    // Ensure imported namespaces contain dereferenced properties as they are dereferenced
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/namespace.md
    'import/namespace': ['error', { allowComputed: false }],
    // Enforce a newline after import statements
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/newline-after-import.md
    'import/newline-after-import': 'error',
    // Report AMD `require` and `define` calls
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-amd.md
    'import/no-amd': 'error',
    // Forbid anonymous values as default exports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-anonymous-default-export.md
    'import/no-anonymous-default-export': [
      'error',
      {
        allowArray: false,
        allowArrowFunction: false,
        allowAnonymousClass: false,
        allowAnonymousFunction: false,
        allowCallExpression: true, // The true value here is for backward compatibility
        allowLiteral: false,
        allowObject: false,
      },
    ],
    // Forbid import of modules using absolute paths
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-absolute-path.md
    'import/no-absolute-path': ['error', { esmodule: true, commonjs: true, amd: false }],
    // Report CommonJS `require` calls and `module.exports` or `exports.*`
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-commonjs.md
    // Off due to some files requiring commonjs currently
    'import/no-commonjs': [
      'off',
      { allowRequire: true, allowConditionalRequire: true, allowPrimitiveModules: true },
    ],
    // Forbid a module from importing a module with a dependency path back to itself
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md
    'import/no-cycle': [
      'error',
      { commonjs: false, amd: false, maxDepth: Infinity, ignoreExternal: true },
    ],
    // Forbid default exports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-default-export.md
    // Do not want to disallow default exports
    'import/no-default-export': 'error',
    // Report imported names marked with `@deprecated` documentation tag
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-deprecated.md
    'import/no-deprecated': 'warn',
    // Report repeated `import` of the same module in multiple places
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-duplicates.md
    'import/no-duplicates': ['error', { considerQueryString: true }],
    // Forbid `require()` calls with expressions
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-dynamic-require.md
    'import/no-dynamic-require': 'error',
    // Forbid the use of extraneous packages
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
    // FIXME: Turn on? Turned off as wasn't resolving workspace deps correctly - Use Globs instead?
    'import/no-extraneous-dependencies': [
      'off',
      {
        devDependencies: true,
        optionalDependencies: true,
        peerDependencies: true,
        bundledDependencies: true,
      },
    ],
    // Forbid imports with CommonJS exports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-import-module-exports.md
    'import/no-import-module-exports': ['error', { exceptions: [] }],
    // Prevent importing the submodules of other modules
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-internal-modules.md
    // Don't need to prevent imports currently
    'import/no-internal-modules': ['off', { allow: [], forbid: [] }],
    // Forbid the use of mutable exports with `var` or `let`
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-mutable-exports.md
    'import/no-mutable-exports': ['error'],
    // Forbid named default exports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-named-default.md
    'import/no-named-default': 'error',
    // Forbid named exports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-named-export.md
    // Do not want to disallow named exports
    'import/no-named-export': 'off',
    // Report use of exported name as identifier of default export
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-named-as-default.md
    'import/no-named-as-default': 'error',
    // Report use of exported name as property of default export
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-named-as-default-member.md
    'import/no-named-as-default-member': 'error',
    // Forbid namespace (a.k.a. "wildcard" `*`) imports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-namespace.md
    'import/no-namespace': ['error', { ignore: [] }],
    // No Node.js builtin modules
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-nodejs-modules.md
    // Not really an issue in our project
    'import/no-nodejs-modules': ['off', { allow: ['fs', 'path'] }],
    // Prevent importing packages through relative paths
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-relative-packages.md
    'import/no-relative-packages': 'off',
    // Forbid importing modules from parent directories
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-relative-parent-imports.md
    // Do not want to restrict importing from parent paths
    'import/no-relative-parent-imports': 'off',
    // Restrict which files can be imported in a given folder
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md
    // Not currently needing to be enforced
    'import/no-restricted-paths': ['off', { zones: [], basePath: '.' }],
    // Forbid a module from importing itself
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-self-import.md
    'import/no-self-import': 'error',
    // Forbid unassigned imports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-unassigned-import.md
    'import/no-unassigned-import': [
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
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-unresolved.md
    // Off for now as reporting false positives - imports that are resolved in Typescript,
    'import/no-unresolved': ['off', { commonjs: false, amd: false }],
    // Report modules without exports, or exports without matching import in another module
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-unused-modules.md
    'import/no-unused-modules': [
      'off',
      { missingExports: false, unusedExports: true, src: [process.cwd()] },
    ],
    // Prevent unnecessary path segments in import and require statements
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-useless-path-segments.md
    'import/no-useless-path-segments': ['error', { noUselessIndex: false, commonjs: true }],
    // Forbid webpack loader syntax in imports
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-webpack-loader-syntax.md
    'import/no-webpack-loader-syntax': 'error',
    // Enforce a convention in module import order
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
    'import/order': [
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
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/prefer-default-export.md
    // Off as named exports can be better to ensure items are identifiable by name
    'import/prefer-default-export': 'off',
    // Report potentially ambiguous parse goal (`script` vs. `module`)
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/unambiguous.md
    'import/unambiguous': 'error',
  },
};
