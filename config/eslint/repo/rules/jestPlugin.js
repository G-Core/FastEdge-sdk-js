export default {
  settings: {
    jest: { version: 30 },
  },
  rules: {
    // Ban expect.hasAssertions() in favor of expect.assertions(n)
    // (replaces eslint-plugin-ban)
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
      {
        selector: 'CallExpression[callee.object.name="expect"][callee.property.name="hasAssertions"]',
        message: 'Please use `expect.assertions(n)` instead of `expect.hasAssertions()`.',
      },
    ],

    // Turn off other rules
    'max-classes-per-file': 'off',
    'no-magic-numbers': 'off',
    'sort-keys': 'off',

    // Have control over test and it usages
    'jest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
    // Enforce assertion to be made in a test body
    'jest/expect-expect': [
      'error',
      { assertFunctionNames: ['expect'], additionalTestBlockFunctions: [] },
    ],
    // Enforces a maximum depth to nested describe calls
    'jest/max-nested-describe': ['off', { max: 5 }],
    // Disallow alias methods
    'jest/no-alias-methods': 'error',
    // Disallow commented out tests
    'jest/no-commented-out-tests': 'warn',
    // Prevent calling expect conditionally
    'jest/no-conditional-expect': 'error',
    // Disallow use of deprecated functions
    'jest/no-deprecated-functions': 'error',
    // Disallow disabled tests
    'jest/no-disabled-tests': 'error',
    // Avoid using a callback in asynchronous tests and hooks
    'jest/no-done-callback': 'error',
    // Disallow duplicate setup and teardown hooks
    'jest/no-duplicate-hooks': 'error',
    // Disallow focused tests
    'jest/no-focused-tests': 'error',
    // Disallow setup and teardown hooks
    'jest/no-hooks': ['off', { allow: [] }],
    // Disallow identical titles
    'jest/no-identical-title': 'error',
    // Disallow string interpolation inside snapshots
    'jest/no-interpolation-in-snapshots': 'error',
    // Disallow Jasmine globals
    'jest/no-jasmine-globals': 'error',
    // Disallow large snapshots
    'jest/no-large-snapshots': ['error', { maxSize: 15, inlineMaxSize: 15 }],
    // Disallow manually importing from `__mocks__`
    'jest/no-mocks-import': 'error',
    // Disallow specific matchers & modifiers
    'jest/no-restricted-matchers': ['error', {}],
    // Disallow using `expect` outside of `it` or `test` blocks
    'jest/no-standalone-expect': ['error', { additionalTestBlockFunctions: [] }],
    // Use `.only `and `.skip` over `f` and `x`
    'jest/no-test-prefixes': 'error',
    // Disallow explicitly returning from tests
    'jest/no-test-return-statement': 'error',
    // Suggest using `toBeCalledWith()` or `toHaveBeenCalledWith()`
    'jest/prefer-called-with': 'error',
    // Suggest using `expect.assertions()` OR `expect.hasAssertions()
    'jest/prefer-expect-assertions': [
      'error',
      {
        onlyFunctionsWithAsyncKeyword: false,
        onlyFunctionsWithExpectInCallback: false,
        onlyFunctionsWithExpectInLoop: false,
      },
    ],
    // Prefer `await expect(...).resolves` over `expect(await ...)` syntax
    'jest/prefer-expect-resolves': 'error',
    // Suggest having hooks before any test cases
    'jest/prefer-hooks-on-top': 'error',
    // Enforce lowercase test names
    'jest/prefer-lowercase-title': [
      'off',
      {
        ignore: ['describe', 'test', 'it'],
        allowedPrefixes: [],
        ignoreTopLevelDescribe: false,
      },
    ],
    // Suggest using `jest.spyOn()`
    'jest/prefer-spy-on': 'error',
    // Suggest using `toStrictEqual()`
    'jest/prefer-strict-equal': 'error',
    // Suggest using `toBe()` for primitive literals
    'jest/prefer-to-be': 'error',
    // Suggest using `toContain()`
    'jest/prefer-to-contain': 'error',
    // Suggest using `toHaveLength()`
    'jest/prefer-to-have-length': 'error',
    // Suggest using `test.todo`
    'jest/prefer-todo': 'error',
    // Require setup and teardown code to be within a hook
    'jest/require-hook': ['error', { allowedFunctionCalls: [] }],
    // Require a message for `toThrow()`
    'jest/require-to-throw-message': 'error',
    // Require test cases and hooks to be inside a `describe` block
    'jest/require-top-level-describe': ['error', { maxNumberOfTopLevelDescribes: 1 }],
    // Enforce valid `describe()` callback
    'jest/valid-describe-callback': 'error',
    // Enforce valid `expect() `usage
    'jest/valid-expect': ['error', { alwaysAwait: false, minArgs: 1, maxArgs: 1 }],
    // Ensure promises that have expectations in their chain are valid
    'jest/valid-expect-in-promise': 'error',
    // Enforce valid titles
    'jest/valid-title': [
      'error',
      { ignoreTypeOfDescribeName: false, disallowedWords: [], mustNotMatch: {}, mustMatch: {} },
    ],
  },
};
