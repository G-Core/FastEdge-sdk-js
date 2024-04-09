module.exports = {
  plugins: ['unicorn'],
  settings: {},
  rules: {
    // Improve regexes by making them shorter, consistent, and safer
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/better-regex.md
    'unicorn/better-regex': ['error', { sortCharacterClasses: true }],
    // Enforce a specific parameter name in catch clauses
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/catch-error-name.md
    'unicorn/catch-error-name': ['error', { name: 'error', ignore: [] }],
    // Use destructured variables over properties
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-destructuring.md
    'unicorn/consistent-destructuring': 'error',
    // Move function definitions to the highest possible scope
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-function-scoping.md
    'unicorn/consistent-function-scoping': ['error', { checkArrowFunctions: true }],
    // Enforce correct `Error` subclassing
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/custom-error-definition.md
    'unicorn/custom-error-definition': 'error',
    // Enforce no spaces between braces
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/empty-brace-spaces.md
    'unicorn/empty-brace-spaces': 'error',
    // Enforce passing a `message` value when creating a built-in error
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/error-message.md
    'unicorn/error-message': 'error',
    // Require escape sequences to use uppercase values
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/escape-case.md
    'unicorn/escape-case': 'error',
    // Add expiration conditions to `TODO` comments
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md
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
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/explicit-length-check.md
    'unicorn/explicit-length-check': ['error', { 'non-zero': 'greater-than' }],
    // Enforce a case style for filenames
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/filename-case.md
    'unicorn/filename-case': ['error', { cases: { kebabCase: true }, ignore: [] }],
    // Enforce importing index files with `.`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/import-index.md
    'unicorn/import-index': ['error', { ignoreImports: false }],
    // Enforce specific import styles per module
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/import-style.md
    // Do not want to enforce an import style at this stage
    'unicorn/import-style': 'off',
    // Enforce the use of new for all builtins, except `String`, `Number`, `Boolean`, `Symbol`
    // and `BigInt`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/new-for-builtins.md
    'unicorn/new-for-builtins': 'error',
    // Enforce specifying rules to disable in eslint-disable comments
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-abusive-eslint-disable.md
    'unicorn/no-abusive-eslint-disable': 'error',
    // Prevent passing a function reference directly to iterator methods
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-callback-reference.md
    'unicorn/no-array-callback-reference': 'off',
    // Prefer `for…of` over `Array#forEach(…)`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-for-each.md
    'unicorn/no-array-for-each': 'error',
    // Disallow using the `this` argument in array methods
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-method-this-argument.md
    'unicorn/no-array-method-this-argument': 'error',
    // Enforce combining multiple `Array#push()` into one call
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-push-push.md
    'unicorn/no-array-push-push': ['error', { ignore: ['stream', 'this', 'this.stream'] }],
    // Disallow `Array#reduce()` and `Array#reduceRight()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-reduce.md
    'unicorn/no-array-reduce': ['off', { allowSimpleOperations: true }],
    // Forbid member access from await expression
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-await-expression-member.md
    'unicorn/no-await-expression-member': 'error',
    // Do not use leading/trailing space between `console.log` parameters
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-console-spaces.md
    'unicorn/no-console-spaces': 'error',
    // Do not use `document.cookie` directly
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-document-cookie.md
    'unicorn/no-document-cookie': 'error',
    // Disallow empty files
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-empty-file.md
    'unicorn/no-empty-file': 'error',
    // Do not use a `for` loop that can be replaced with a `for-of` loop
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-for-loop.md
    'unicorn/no-for-loop': 'error',
    // Enforce the use of Unicode escapes instead of hexadecimal escapes
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-hex-escape.md
    'unicorn/no-hex-escape': 'error',
    // Require `Array.isArray()` instead of `instanceof Array`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-array.md
    'unicorn/no-instanceof-array': 'error',
    // Prevent calling `EventTarget#removeEventListener()` with the result of an expression
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-remove-event-listener.md
    'unicorn/no-invalid-remove-event-listener': 'error',
    // Disallow identifiers starting with `new` or `class`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-keyword-prefix.md
    'unicorn/no-keyword-prefix': [
      'error',
      { disallowedPrefixes: [], checkProperties: true, onlyCamelCase: true },
    ],
    // Disallow `if` statements as the only statement in `if` blocks without `else`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-lonely-if.md
    'unicorn/no-lonely-if': 'error',
    // Disallow nested ternary expressions
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-nested-ternary.md
    // Off as conflicts with prettier
    'unicorn/no-nested-ternary': 'off',
    // Disallow `new Array()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-array.md
    'unicorn/no-new-array': 'error',
    // Enforce the use of `Buffer.from()` and `Buffer.alloc()` instead of the deprecated `new Buffer()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-buffer.md
    'unicorn/no-new-buffer': 'error',
    // Disallow the use of the `null` literal
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-null.md
    // Off as causes issues with react returning null
    'unicorn/no-null': ['off', { checkStrictEquality: false }],
    // Disallow the use of objects as default parameters
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-object-as-default-parameter.md
    'unicorn/no-object-as-default-parameter': 'error',
    // Disallow `process.exit()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-process-exit.md
    // Off as an extension to a deprecated rule
    'unicorn/no-process-exit': 'off',
    // Forbid classes that only have static members.
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-static-only-class.md
    'unicorn/no-static-only-class': 'error',
    // Disallow `then` property
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-thenable.md
    'unicorn/no-thenable': 'error',
    // Disallow assigning `this` to a variable
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-this-assignment.md
    'unicorn/no-this-assignment': 'error',
    // Disallow unreadable array destructuring
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-array-destructuring.md
    // Off as want to prefer destructuring
    'unicorn/no-unreadable-array-destructuring': 'off',
    // Disallow unsafe regular expressions
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unsafe-regex.md
    'unicorn/no-unsafe-regex': 'error',
    // Disallow unused object properties
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unused-properties.md
    'unicorn/no-unused-properties': 'error',
    // Forbid useless fallback when spreading in object literals
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-fallback-in-spread.md
    'unicorn/no-useless-fallback-in-spread': 'error',
    // Disallow useless array length check
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-length-check.md
    'unicorn/no-useless-length-check': 'error',
    // Disallow returning/yielding `Promise.resolve/reject()` in async functions or promise callbacks
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-promise-resolve-reject.md
    'unicorn/no-useless-promise-resolve-reject': 'error',
    // Disallow unnecessary spread
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-spread.md
    'unicorn/no-useless-spread': 'error',
    // Disallow useless `undefined`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-undefined.md
    'unicorn/no-useless-undefined': ['error', { checkArguments: true }],
    // Disallow number literals with zero fractions or dangling dots
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-zero-fractions.md
    'unicorn/no-zero-fractions': 'error',
    // Enforce proper case for numeric literals
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/number-literal-case.md
    // Off as conflicts with prettier
    'unicorn/number-literal-case': 'off',
    // Enforce the style of numeric separators by correctly grouping digits
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/numeric-separators-style.md
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
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-add-event-listener.md
    'unicorn/prefer-add-event-listener': ['error', { excludedPackages: ['koa', 'sax'] }],
    // Prefer `.find(…)` over the first element from `.filter(…)`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-find.md
    'unicorn/prefer-array-find': 'error',
    // Prefer `Array#flat()` over legacy techniques to flatten arrays
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat.md
    // Off as not targeting ES2019
    'unicorn/prefer-array-flat': ['off', { functions: [] }],
    // Prefer `.flatMap(…)` over `.map(…).flat()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat-map.md
    'unicorn/prefer-flat-map': 'error',
    // Prefer `Array#indexOf()` over `Array#findIndex()` when looking for the index of an item
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-index-of.md
    'unicorn/prefer-array-index-of': 'error',
    // Prefer `.some(…)` over `.filter(…).length` check and `.find(…)`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-some.md
    'unicorn/prefer-array-some': 'error',
    // Prefer `.at()` method for index access and `String#charAt()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-at.md
    'unicorn/prefer-at': ['error', { checkAllIndexAccess: false, getLastElementFunctions: [] }],
    // Prefer `String#codePointAt(…)` over `String#charCodeAt(…)` and `String.fromCodePoint(…)`
    //  over `String.fromCharCode(…)`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-code-point.md
    'unicorn/prefer-code-point': 'error',
    // Prefer `Date.now()` to get the number of milliseconds since the Unix Epoch
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-date-now.md
    'unicorn/prefer-date-now': 'error',
    // Prefer default parameters over reassignment
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-default-parameters.md
    'unicorn/prefer-default-parameters': 'error',
    // Prefer `Node#append()` over `Node#appendChild()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-append.md
    'unicorn/prefer-dom-node-append': 'error',
    // Prefer using `.dataset` on DOM elements over calling attribute methods
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-dataset.md
    'unicorn/prefer-dom-node-dataset': 'error',
    // Prefer `childNode.remove()` over `parentNode.removeChild(childNode)`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-remove.md
    'unicorn/prefer-dom-node-remove': 'error',
    // Prefer `.textContent` over `.innerText`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-text-content.md
    'unicorn/prefer-dom-node-text-content': 'error',
    // Prefer `export…from` when re-exporting
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-export-from.md
    'unicorn/prefer-export-from': ['error', { ignoreUsedVariables: false }],
    // Prefer `.includes()` over `.indexOf()` and `Array#some()` when checking for existence
    //  or non-existence
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-includes.md
    'unicorn/prefer-includes': 'error',
    // Prefer reading a JSON file as a buffer
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-json-parse-buffer.md
    'unicorn/prefer-json-parse-buffer': 'error',
    // Prefer `KeyboardEvent#key` over `KeyboardEvent#keyCode`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-keyboard-event-key.md
    'unicorn/prefer-keyboard-event-key': 'error',
    // Enforce the use of `Math.trunc` instead of bitwise operators
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-trunc.md
    'unicorn/prefer-math-trunc': 'error',
    // Prefer `.before() `over `.insertBefore()`, `.replaceWith()` over `.replaceChild()`,
    //  prefer one of `.before()`, ``.after()`, `.append()` or `.prepend()` over
    //  `insertAdjacentText()` and `insertAdjacentElement()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-modern-dom-apis.md
    'unicorn/prefer-modern-dom-apis': 'error',
    // Prefer JavaScript modules (ESM) over CommonJS
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-module.md
    'unicorn/prefer-module': 'error',
    // Prefer negative index over `.length - index` for `{String,Array,TypedArray}#slice()`,
    //  `Array#splice()` and `Array#at()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-negative-index.md
    'unicorn/prefer-negative-index': 'error',
    // Prefer using the `node:` protocol when importing Node.js builtin modules
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md
    'unicorn/prefer-node-protocol': 'error',
    // Prefer `Number` static properties over global ones
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-number-properties.md
    // TODO: Convert this to error once fixed
    'unicorn/prefer-number-properties': 'error',
    // Prefer using `Object.fromEntries(…)` to transform a list of key-value pairs into an object
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-from-entries.md
    'unicorn/prefer-object-from-entries': ['error', { functions: [] }],
    // Prefer omitting the `catch` binding parameter
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-optional-catch-binding.md
    'unicorn/prefer-optional-catch-binding': 'error',
    // Prefer borrowing methods from the prototype instead of the instance
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-prototype-methods.md
    'unicorn/prefer-prototype-methods': 'error',
    // Prefer `.querySelector()` over `.getElementById()`, `.querySelectorAll()` over
    //  `.getElementsByClassName()` and `.getElementsByTagName()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-query-selector.md
    'unicorn/prefer-query-selector': 'error',
    // Prefer `Reflect.apply()` over F`unction#apply()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-reflect-apply.md
    'unicorn/prefer-reflect-apply': 'error',
    // Prefer `RegExp#test()` over `String#match()` and `RegExp#exec()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md
    'unicorn/prefer-regexp-test': 'error',
    // Prefer `Set#has()` over `Array#includes()` when checking for existence or non-existence
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-has.md
    'unicorn/prefer-set-has': 'error',
    // Prefer the spread operator over `Array.from(…)`, `Array#concat(…)`, `Array#slice()`
    //  and `String#split('')`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-spread.md
    'unicorn/prefer-spread': 'error',
    // Prefer `String#replaceAll()` over regex searches with the global flag
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-replace-all.md
    // Off as targetting ES2019 and not included until ES2021
    'unicorn/prefer-string-replace-all': 'off',
    // Prefer `String#slice()` over `String#substr()` and `String#substring()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-slice.md
    'unicorn/prefer-string-slice': 'error',
    // Prefer `String#startsWith()` & `String#endsWith()` over `RegExp#test()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-starts-ends-with.md
    'unicorn/prefer-string-starts-ends-with': 'error',
    // Prefer `String#trimStart()`/`String#trimEnd()` over `String#trimLeft()`/`String#trimRight()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-trim-start-end.md
    'unicorn/prefer-string-trim-start-end': 'error',
    // Prefer `switch` over multiple `else-if`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-switch.md
    'unicorn/prefer-switch': ['error', { minimumCases: 3, emptyDefaultCase: 'no-default-comment' }],
    // Prefer ternary expressions over simple `if-else` statements
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-ternary.md
    'unicorn/prefer-ternary': ['error', 'always'],
    // Prefer top-level await over top-level promises and async function calls
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-top-level-await.md
    'unicorn/prefer-top-level-await': 'error',
    // Enforce throwing `TypeError` in type checking conditions
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-type-error.md
    'unicorn/prefer-type-error': 'error',
    // Prevent abbreviations
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prevent-abbreviations.md
    // Don't want to prevent abbrev. currently
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
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/relative-url-style.md
    'unicorn/relative-url-style': ['error', 'always'],
    // Enforce using the separator argument with `Array#join()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-array-join-separator.md
    'unicorn/require-array-join-separator': 'error',
    // Enforce using the digits argument with `Number#toFixed()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-number-to-fixed-digits-argument.md
    'unicorn/require-number-to-fixed-digits-argument': 'error',
    // Enforce using the `targetOrigin` argument with `window.postMessage()`
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-post-message-target-origin.md
    'unicorn/require-post-message-target-origin': 'error',
    // Enforce better string content
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/string-content.md
    // Turned off until understand the replacements more clearly
    'unicorn/string-content': ['off', { patterns: {} }],
    // Fix whitespace-insensitive template indentation
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/template-indent.md
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
    // https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/throw-new-error.md
    'unicorn/throw-new-error': 'error',
  },
};
