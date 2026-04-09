export default {
  rules: {
    // Improve regexes by making them shorter, consistent, and safer
    'unicorn/better-regex': ['error', { sortCharacterClasses: true }],
    // Enforce a specific parameter name in catch clauses
    'unicorn/catch-error-name': ['error', { name: 'error', ignore: [] }],
    // Use destructured variables over properties
    'unicorn/consistent-destructuring': 'error',
    // Move function definitions to the highest possible scope
    'unicorn/consistent-function-scoping': ['error', { checkArrowFunctions: true }],
    // Enforce correct `Error` subclassing
    'unicorn/custom-error-definition': 'error',
    // Enforce no spaces between braces
    'unicorn/empty-brace-spaces': 'error',
    // Enforce passing a `message` value when creating a built-in error
    'unicorn/error-message': 'error',
    // Require escape sequences to use uppercase values
    'unicorn/escape-case': 'error',
    // Add expiration conditions to `TODO` comments
    'unicorn/expiring-todo-comments': [
      'error',
      {
        ignoreDatesOnPullRequests: true,
        terms: ['todo', 'fixme', 'xxx'],
        allowWarningComments: true,
        ignore: [],
      },
    ],
    // Enforce explicitly comparing the `length` or `size` property of a value
    'unicorn/explicit-length-check': ['error', { 'non-zero': 'greater-than' }],
    // Enforce a case style for filenames
    'unicorn/filename-case': ['error', { cases: { kebabCase: true }, ignore: [] }],
    // Enforce specific import styles per module
    'unicorn/import-style': 'off',
    // Enforce the use of new for all builtins, except `String`, `Number`, `Boolean`, `Symbol`
    // and `BigInt`
    'unicorn/new-for-builtins': 'error',
    // Enforce specifying rules to disable in eslint-disable comments
    'unicorn/no-abusive-eslint-disable': 'error',
    // Prevent passing a function reference directly to iterator methods
    'unicorn/no-array-callback-reference': 'off',
    // Prefer `for…of` over `Array#forEach(…)`
    'unicorn/no-array-for-each': 'error',
    // Disallow using the `this` argument in array methods
    'unicorn/no-array-method-this-argument': 'error',
    // Enforce combining multiple `Array#push()` into one call
    // (renamed from unicorn/no-array-push-push in v59)
    'unicorn/prefer-single-call': ['error', { ignore: ['stream', 'this', 'this.stream'] }],
    // Disallow `Array#reduce()` and `Array#reduceRight()`
    'unicorn/no-array-reduce': ['off', { allowSimpleOperations: true }],
    // Forbid member access from await expression
    'unicorn/no-await-expression-member': 'error',
    // Do not use leading/trailing space between `console.log` parameters
    'unicorn/no-console-spaces': 'error',
    // Do not use `document.cookie` directly
    'unicorn/no-document-cookie': 'error',
    // Disallow empty files
    'unicorn/no-empty-file': 'error',
    // Do not use a `for` loop that can be replaced with a `for-of` loop
    'unicorn/no-for-loop': 'error',
    // Enforce the use of Unicode escapes instead of hexadecimal escapes
    'unicorn/no-hex-escape': 'error',
    // Require `Array.isArray()` instead of `instanceof Array`
    'unicorn/no-instanceof-array': 'error',
    // Prevent calling `EventTarget#removeEventListener()` with the result of an expression
    'unicorn/no-invalid-remove-event-listener': 'error',
    // Disallow identifiers starting with `new` or `class`
    'unicorn/no-keyword-prefix': [
      'error',
      { disallowedPrefixes: [], checkProperties: true, onlyCamelCase: true },
    ],
    // Disallow `if` statements as the only statement in `if` blocks without `else`
    'unicorn/no-lonely-if': 'error',
    // Disallow nested ternary expressions
    // Off as conflicts with prettier
    'unicorn/no-nested-ternary': 'off',
    // Disallow `new Array()`
    'unicorn/no-new-array': 'error',
    // Disallow the use of the `null` literal
    // Off as causes issues with react returning null
    'unicorn/no-null': ['off', { checkStrictEquality: false }],
    // Disallow the use of objects as default parameters
    'unicorn/no-object-as-default-parameter': 'error',
    // Forbid classes that only have static members.
    'unicorn/no-static-only-class': 'error',
    // Disallow `then` property
    'unicorn/no-thenable': 'error',
    // Disallow assigning `this` to a variable
    'unicorn/no-this-assignment': 'error',
    // Disallow unreadable array destructuring
    // Off as want to prefer destructuring
    'unicorn/no-unreadable-array-destructuring': 'off',
    // Disallow unused object properties
    'unicorn/no-unused-properties': 'error',
    // Forbid useless fallback when spreading in object literals
    'unicorn/no-useless-fallback-in-spread': 'error',
    // Disallow useless array length check
    'unicorn/no-useless-length-check': 'error',
    // Disallow returning/yielding `Promise.resolve/reject()` in async functions or promise callbacks
    'unicorn/no-useless-promise-resolve-reject': 'error',
    // Disallow unnecessary spread
    'unicorn/no-useless-spread': 'error',
    // Disallow useless `undefined`
    'unicorn/no-useless-undefined': ['error', { checkArguments: true }],
    // Disallow number literals with zero fractions or dangling dots
    'unicorn/no-zero-fractions': 'error',
    // Enforce proper case for numeric literals
    // Off as conflicts with prettier
    'unicorn/number-literal-case': 'off',
    // Enforce the style of numeric separators by correctly grouping digits
    'unicorn/numeric-separators-style': [
      'error',
      {
        onlyIfContainsSeparator: true,
        hexadecimal: {
          minimumDigits: 0,
          groupLength: 2,
        },
        binary: {
          minimumDigits: 0,
          groupLength: 4,
        },
        octal: {
          minimumDigits: 0,
          groupLength: 4,
        },
        number: {
          minimumDigits: 5,
          groupLength: 3,
        },
      },
    ],
    // Prefer `.addEventListener()` and `.removeEventListener()` over on-functions
    'unicorn/prefer-add-event-listener': ['error', { excludedPackages: ['koa', 'sax'] }],
    // Prefer `.find(…)` over the first element from `.filter(…)`
    'unicorn/prefer-array-find': 'error',
    // Prefer `Array#flat()` over legacy techniques to flatten arrays
    'unicorn/prefer-array-flat': ['off', { functions: [] }],
    // Prefer `.flatMap(…)` over `.map(…).flat()`
    // (renamed from unicorn/prefer-flat-map in recent versions)
    'unicorn/prefer-array-flat-map': 'error',
    // Prefer `Array#indexOf()` over `Array#findIndex()` when looking for the index of an item
    'unicorn/prefer-array-index-of': 'error',
    // Prefer `.some(…)` over `.filter(…).length` check and `.find(…)`
    'unicorn/prefer-array-some': 'error',
    // Prefer `.at()` method for index access and `String#charAt()`
    'unicorn/prefer-at': ['error', { checkAllIndexAccess: false, getLastElementFunctions: [] }],
    // Prefer `String#codePointAt(…)` over `String#charCodeAt(…)` and `String.fromCodePoint(…)`
    //  over `String.fromCharCode(…)`
    'unicorn/prefer-code-point': 'error',
    // Prefer `Date.now()` to get the number of milliseconds since the Unix Epoch
    'unicorn/prefer-date-now': 'error',
    // Prefer default parameters over reassignment
    'unicorn/prefer-default-parameters': 'error',
    // Prefer `Node#append()` over `Node#appendChild()`
    'unicorn/prefer-dom-node-append': 'error',
    // Prefer using `.dataset` on DOM elements over calling attribute methods
    'unicorn/prefer-dom-node-dataset': 'error',
    // Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`
    'unicorn/prefer-dom-node-remove': 'error',
    // Prefer `.textContent` over `.innerText`
    'unicorn/prefer-dom-node-text-content': 'error',
    // Prefer `export…from` when re-exporting
    'unicorn/prefer-export-from': ['error', { ignoreUsedVariables: false }],
    // Prefer `.includes()` over `.indexOf()` and `Array#some()` when checking for existence
    //  or non-existence
    'unicorn/prefer-includes': 'error',
    // Prefer reading a JSON file as a buffer
    'unicorn/prefer-json-parse-buffer': 'error',
    // Prefer `KeyboardEvent#key` over `KeyboardEvent#keyCode`
    'unicorn/prefer-keyboard-event-key': 'error',
    // Enforce the use of `Math.trunc` instead of bitwise operators
    'unicorn/prefer-math-trunc': 'error',
    // Prefer `.before() `over `.insertBefore()`, `.replaceWith()` over `.replaceChild()`
    'unicorn/prefer-modern-dom-apis': 'error',
    // Prefer JavaScript modules (ESM) over CommonJS
    'unicorn/prefer-module': 'error',
    // Prefer negative index over `.length - index`
    'unicorn/prefer-negative-index': 'error',
    // Prefer using the `node:` protocol when importing Node.js builtin modules
    'unicorn/prefer-node-protocol': 'error',
    // Prefer `Number` static properties over global ones
    'unicorn/prefer-number-properties': 'error',
    // Prefer using `Object.fromEntries(…)` to transform a list of key-value pairs into an object
    'unicorn/prefer-object-from-entries': ['error', { functions: [] }],
    // Prefer omitting the `catch` binding parameter
    'unicorn/prefer-optional-catch-binding': 'error',
    // Prefer borrowing methods from the prototype instead of the instance
    'unicorn/prefer-prototype-methods': 'error',
    // Prefer `.querySelector()` over `.getElementById()`
    'unicorn/prefer-query-selector': 'error',
    // Prefer `Reflect.apply()` over `Function#apply()`
    'unicorn/prefer-reflect-apply': 'error',
    // Prefer `RegExp#test()` over `String#match()` and `RegExp#exec()`
    'unicorn/prefer-regexp-test': 'error',
    // Prefer `Set#has()` over `Array#includes()` when checking for existence or non-existence
    'unicorn/prefer-set-has': 'error',
    // Prefer the spread operator over `Array.from(…)`, `Array#concat(…)`, `Array#slice()`
    'unicorn/prefer-spread': 'error',
    // Prefer `String#replaceAll()` over regex searches with the global flag
    'unicorn/prefer-string-replace-all': 'off',
    // Prefer `String#slice()` over `String#substr()` and `String#substring()`
    'unicorn/prefer-string-slice': 'error',
    // Prefer `String#startsWith()` & `String#endsWith()` over `RegExp#test()`
    'unicorn/prefer-string-starts-ends-with': 'error',
    // Prefer `String#trimStart()`/`String#trimEnd()` over `String#trimLeft()`/`String#trimRight()`
    'unicorn/prefer-string-trim-start-end': 'error',
    // Prefer `switch` over multiple `else-if`
    'unicorn/prefer-switch': ['error', { minimumCases: 3, emptyDefaultCase: 'no-default-comment' }],
    // Prefer ternary expressions over simple `if-else` statements
    'unicorn/prefer-ternary': ['error', 'always'],
    // Prefer top-level await over top-level promises and async function calls
    'unicorn/prefer-top-level-await': 'error',
    // Enforce throwing `TypeError` in type checking conditions
    'unicorn/prefer-type-error': 'error',
    // Prevent abbreviations
    'unicorn/prevent-abbreviations': [
      'off',
      {
        replacements: {},
        extendDefaultReplacements: false,
        allowList: {},
        extendDefaultAllowList: false,
        checkDefaultAndNamespaceImports: 'internal',
        checkShorthandImports: 'internal',
        checkShorthandProperties: false,
        checkProperties: false,
        checkVariables: true,
        checkFilenames: true,
        ignore: [],
      },
    ],
    // Enforce consistent relative URL style
    'unicorn/relative-url-style': ['error', 'always'],
    // Enforce using the separator argument with `Array#join()`
    'unicorn/require-array-join-separator': 'error',
    // Enforce using the digits argument with `Number#toFixed()`
    'unicorn/require-number-to-fixed-digits-argument': 'error',
    // Enforce using the `targetOrigin` argument with `window.postMessage()`
    'unicorn/require-post-message-target-origin': 'error',
    // Enforce better string content
    'unicorn/string-content': ['off', { patterns: {} }],
    // Fix whitespace-insensitive template indentation
    'unicorn/template-indent': [
      'warn',
      {
        tags: ['outdent', 'dedent', 'gql', 'sql', 'html', 'styled'],
        functions: ['dedent', 'stripIndent'],
        selectors: [],
        comments: ['HTML', 'indent'],
      },
    ],
    // Require `new` when throwing an error
    'unicorn/throw-new-error': 'error',
  },
};
