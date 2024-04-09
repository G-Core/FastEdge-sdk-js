module.exports = {
  plugins: ['testing-library'],
  settings: {},
  rules: {},
  overrides: [
    {
      files: ['*.test.*', '*.spec.*'],
      rules: {
        // Enforce promises from async queries to be handled
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/await-async-queries.md
        'testing-library/await-async-queries': 'error',
        // Enforce promises from async utils to be awaited properly
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/await-async-utils.md
        'testing-library/await-async-utils': 'error',
        // Enforce promises from `fireEvent` methods to be handled
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/await-fire-event.md
        // Only used for Vue
        'testing-library/await-fire-event': 'off',
        // Ensures consistent usage of `data-testid`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/consistent-data-testid.md
        'testing-library/consistent-data-testid': [
          'error',
          { testIdPattern: '', testIdAttribute: ['data-testid'] },
        ],
        // Disallow unnecessary `await` for sync events
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-await-sync-events.md
        'testing-library/no-await-sync-events': 'error',
        // Disallow unnecessary `await` for sync queries
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-await-sync-queries.md
        'testing-library/no-await-sync-queries': 'error',
        // Disallow the use of `container` methods
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-container.md
        'testing-library/no-container': 'error',
        // Disallow the use of debugging utilities like `debug`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-debugging-utils.md
        'testing-library/no-debugging-utils': [
          'error',
          {
            utilsToCheckFor: {
              debug: true,
              logDOM: true,
              logRoles: true,
              logTestingPlaygroundURL: true,
              prettyDOM: true,
              prettyFormat: true,
            },
          },
        ],
        // Disallow importing from DOM Testing Library
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-dom-import.md
        'testing-library/no-dom-import': ['error', 'react'],
        // Disallow the use of `cleanup`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-manual-cleanup.md
        'testing-library/no-manual-cleanup': 'error',
        // Disallow direct Node access
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-node-access.md
        'testing-library/no-node-access': 'error',
        // Disallow the use of promises passed to a `fireEvent` method
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-promise-in-fire-event.md
        'testing-library/no-promise-in-fire-event': 'error',
        // Disallow the use of `render` in testing frameworks setup functions
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-render-in-lifecycle.md
        'testing-library/no-render-in-lifecycle': ['error', {}],
        // Disallow wrapping Testing Library utils or empty callbacks in `act`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-unnecessary-act.md
        'testing-library/no-unnecessary-act': ['error', { isStrict: false }],
        // Disallow the use of multiple `expect` calls inside `waitFor`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-wait-for-multiple-assertions.md
        'testing-library/no-wait-for-multiple-assertions': 'error',
        // Disallow the use of side effects in `waitFor`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-wait-for-side-effects.md
        'testing-library/no-wait-for-side-effects': 'error',
        // Ensures no snapshot is generated inside of a waitFor call
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/no-wait-for-snapshot.md
        'testing-library/no-wait-for-snapshot': 'error',
        // Suggest using explicit assertions rather than standalone queries
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-explicit-assert.md
        'testing-library/prefer-explicit-assert': ['off', {}],
        // Suggest using `find(All)By*` query instead of `waitFor` + `get(All)By*` to wait for elements
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-find-by.md
        'testing-library/prefer-find-by': 'error',
        // Ensure appropriate `get*`/`query*` queries are used with their respective matchers
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-presence-queries.md
        'testing-library/prefer-presence-queries': 'error',
        // Suggest using `queryBy* `queries when waiting for disappearance
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-query-by-disappearance.md
        'testing-library/prefer-query-by-disappearance': 'error',
        // Suggest using `screen` while querying
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-screen-queries.md
        'testing-library/prefer-screen-queries': 'error',
        // Suggest using `userEvent` over `fireEvent` for simulating user interactions
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/prefer-user-event.md
        'testing-library/prefer-user-event': ['error', { allowedMethods: [] }],
        // Enforce a valid naming for return value from `render`
        // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/docs/rules/render-result-naming-convention.md
        'testing-library/render-result-naming-convention': 'error',
      },
    },
  ],
};
