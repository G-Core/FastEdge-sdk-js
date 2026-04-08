export default {
  rules: {
    // Enforce promises from async queries to be handled
    'testing-library/await-async-queries': 'error',
    // Enforce promises from async utils to be awaited properly
    'testing-library/await-async-utils': 'error',
    // Enforce promises from `fireEvent` methods to be handled
    // Only used for Vue
    'testing-library/await-fire-event': 'off',
    // Ensures consistent usage of `data-testid`
    'testing-library/consistent-data-testid': [
      'error',
      { testIdPattern: '', testIdAttribute: ['data-testid'] },
    ],
    // Disallow unnecessary `await` for sync events
    'testing-library/no-await-sync-events': 'error',
    // Disallow unnecessary `await` for sync queries
    'testing-library/no-await-sync-queries': 'error',
    // Disallow the use of `container` methods
    'testing-library/no-container': 'error',
    // Disallow the use of debugging utilities like `debug`
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
    'testing-library/no-dom-import': ['error', 'react'],
    // Disallow the use of `cleanup`
    'testing-library/no-manual-cleanup': 'error',
    // Disallow direct Node access
    'testing-library/no-node-access': 'error',
    // Disallow the use of promises passed to a `fireEvent` method
    'testing-library/no-promise-in-fire-event': 'error',
    // Disallow the use of `render` in testing frameworks setup functions
    'testing-library/no-render-in-lifecycle': ['error', {}],
    // Disallow wrapping Testing Library utils or empty callbacks in `act`
    'testing-library/no-unnecessary-act': ['error', { isStrict: false }],
    // Disallow the use of multiple `expect` calls inside `waitFor`
    'testing-library/no-wait-for-multiple-assertions': 'error',
    // Disallow the use of side effects in `waitFor`
    'testing-library/no-wait-for-side-effects': 'error',
    // Ensures no snapshot is generated inside of a waitFor call
    'testing-library/no-wait-for-snapshot': 'error',
    // Suggest using explicit assertions rather than standalone queries
    'testing-library/prefer-explicit-assert': ['off', {}],
    // Suggest using `find(All)By*` query instead of `waitFor` + `get(All)By*` to wait for elements
    'testing-library/prefer-find-by': 'error',
    // Ensure appropriate `get*`/`query*` queries are used with their respective matchers
    'testing-library/prefer-presence-queries': 'error',
    // Suggest using `queryBy* `queries when waiting for disappearance
    'testing-library/prefer-query-by-disappearance': 'error',
    // Suggest using `screen` while querying
    'testing-library/prefer-screen-queries': 'error',
    // Suggest using `userEvent` over `fireEvent` for simulating user interactions
    'testing-library/prefer-user-event': ['error', { allowedMethods: [] }],
    // Enforce a valid naming for return value from `render`
    'testing-library/render-result-naming-convention': 'error',
  },
};
