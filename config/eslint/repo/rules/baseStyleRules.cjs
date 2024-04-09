module.exports = {
  rules: {
    // Enforce getter and setter pairs in objects and classes
    // https://eslint.org/docs/rules/accessor-pairs
    'accessor-pairs': [
      'error',
      {
        setWithoutGet: true,
        getWithoutSet: false,
        enforceForClassMembers: true,
      },
    ],
    // Require braces around arrow function bodies
    // https://eslint.org/docs/rules/arrow-body-style
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
    // Enforce the use of variables within the scope they are defined
    // https://eslint.org/docs/rules/block-scoped-var
    'block-scoped-var': 'error',
    // Enforce camelcase naming convention
    // https://eslint.org/docs/rules/camelcase
    camelcase: [
      'error',
      {
        // properties: "never",
        properties: 'always',
        ignoreDestructuring: true,
        ignoreImports: false,
        ignoreGlobals: false,
        allow: [],
      },
    ],
    // Enforce or disallow capitalization of the first letter of a comment
    // https://eslint.org/docs/rules/capitalized-comments
    'capitalized-comments': [
      'warn',
      'always',
      {
        ignorePattern: '^ ?webpackChunkName:',
        ignoreInlineComments: false,
        ignoreConsecutiveComments: true,
      },
    ],
    // Enforce that class methods utilize `this`
    // https://eslint.org/docs/rules/class-methods-use-this
    // { exceptMethods: [],enforceForClassFields: true }
    'class-methods-use-this': 'error',
    // Enforce a maximum cyclomatic complexity allowed in a program
    // https://eslint.org/docs/rules/complexity
    complexity: ['off', { max: 25 }],
    // Require `return` statements to either always or never specify values
    // https://eslint.org/docs/rules/consistent-return
    // Off as prevents returning undefined from an arrow function
    'consistent-return': ['off', { treatUndefinedAsUnspecified: true }],
    // Enforce consistent naming when capturing the current execution context
    // https://eslint.org/docs/rules/consistent-this
    'consistent-this': ['error', 'self'],
    // Enforce consistent brace style for all control statements
    // https://eslint.org/docs/rules/curly
    // FIXME: May conflict with prettier rules - if so, turn off
    curly: ['error', 'multi-line', 'consistent'],
    // Require `default` cases in `switch` statements
    // https://eslint.org/docs/rules/default-case
    'default-case': ['error', { commentPattern: '^No default' }],
    // Enforce default clauses in switch statements to be last
    // https://eslint.org/docs/rules/default-case-last
    'default-case-last': 'error',
    // Enforce default parameters to be last
    // https://eslint.org/docs/rules/default-param-last
    // Turned off in favor of @typescript-eslint/default-param-last
    'default-param-last': 'off',
    // Enforce dot notation whenever possible
    // https://eslint.org/docs/rules/dot-notation
    'dot-notation': ['error', { allowKeywords: true, allowPattern: '' }],
    // Require the use of `===` and `!==`
    // https://eslint.org/docs/rules/eqeqeq
    eqeqeq: ['error', 'smart'],
    // Require function names to match the name of the variable or property to which they
    //  are assigned
    // https://eslint.org/docs/rules/func-name-matching
    'func-name-matching': [
      'error',
      'always',
      {
        considerPropertyDescriptor: true,
        includeCommonJSModuleExports: true,
      },
    ],
    // Require or disallow named `function` expressions
    // https://eslint.org/docs/rules/func-names,
    'func-names': ['error', 'as-needed', { generators: 'always' }],
    // Enforce the consistent use of either `function` declarations or expressions
    // https://eslint.org/docs/rules/func-style
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    // Require grouped accessor pairs in object literals and classes
    // https://eslint.org/docs/rules/grouped-accessor-pairs
    'grouped-accessor-pairs': ['error', 'getBeforeSet'],
    // Require `for-in` loops to include an `if` statement
    // https://eslint.org/docs/rules/guard-for-in
    'guard-for-in': 'error',
    // Disallow specified identifiers
    // https://eslint.org/docs/rules/id-denylist
    // Do not want to block ID's
    'id-denylist': 'off',
    // Enforce minimum and maximum identifier lengths
    // https://eslint.org/docs/rules/id-length
    // Do not want to enforce
    'id-length': 'off',
    // Require identifiers to match a specified regular expression
    // https://eslint.org/docs/rules/id-match
    // Do not want to enforce
    'id-match': ['off', '^[a-z]+([A-Z][a-z]+)*$'],
    // Require or disallow initialization in variable declarations
    // https://eslint.org/docs/rules/init-declarations
    // Do not want to enforce as sometimes we don't want to initialize
    // Prefer @typescript-eslint/init-declarations if this changes
    'init-declarations': 'off',
    // Enforce a maximum number of classes per file
    // https://eslint.org/docs/rules/max-classes-per-file
    'max-classes-per-file': ['error', 1],
    // Enforce a maximum depth that blocks can be nested
    // https://eslint.org/docs/rules/max-depth
    'max-depth': ['error', { max: 6 }],
    // Enforce a maximum number of lines per file
    // https://eslint.org/docs/rules/max-lines
    // Do not want to enforce a limit
    'max-lines': ['off', { max: 300, skipBlankLines: true, skipComments: true }],
    // Enforce a maximum number of lines of code in a function
    // https://eslint.org/docs/rules/max-lines-per-function
    // Do not want to enforce a limit
    'max-lines-per-function': [
      'off',
      { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
    ],
    // Enforce a maximum depth that callbacks can be nested
    // https://eslint.org/docs/rules/max-nested-callbacks
    'max-nested-callbacks': ['error', { max: 10 }],
    // Enforce a maximum number of parameters in function definitions
    // https://eslint.org/docs/rules/max-params
    // Do not want to enforce a limit
    'max-params': ['off', { max: 3 }],
    // Enforce a maximum number of statements allowed in function blocks
    // https://eslint.org/docs/rules/max-statements
    // Do not want to enforce a limit
    'max-statements': ['off', { max: 10, ignoreTopLevelFunctions: true }],
    // Enforce a particular style for multiline comments
    // https://eslint.org/docs/rules/multiline-comment-style
    'multiline-comment-style': ['off', 'starred-block'],
    // Require constructor names to begin with a capital letter
    // https://eslint.org/docs/rules/new-cap
    'new-cap': [
      'error',
      {
        newIsCap: true,
        newIsCapExceptions: [],
        capIsNew: false,
        capIsNewExceptions: [],
        properties: false,
      },
    ],
    // Disallow the use of `alert`, `confirm`, and `prompt`
    // https://eslint.org/docs/rules/no-alert
    'no-alert': 'warn',
    // Disallow `Array` constructors
    // https://eslint.org/docs/rules/no-array-constructor
    // Turned off in favor of @typescript-eslint/no-array-constructor
    'no-array-constructor': 'off',
    // Disallow bitwise operators
    // https://eslint.org/docs/rules/no-bitwise
    'no-bitwise': ['error', { allow: [], int32Hint: true }],
    // Disallow the use of `arguments.caller` or `arguments.callee`
    // https://eslint.org/docs/rules/no-caller
    'no-caller': 'error',
    // Disallow lexical declarations in case clauses
    // https://eslint.org/docs/rules/no-case-declarations
    'no-case-declarations': 'error',
    // Disallow arrow functions where they could be confused with comparisons
    // https://eslint.org/docs/rules/no-confusing-arrow
    // Off as causes issue with prettier, and it's unlikely we're using the style that
    //  this rule was created to solve
    'no-confusing-arrow': ['off', { allowParens: true }],
    // Disallow the use of `console`
    // https://eslint.org/docs/rules/no-console
    'no-console': 'warn',
    // Disallow `continue` statements
    // https://eslint.org/docs/rules/no-continue
    'no-continue': 'off',
    // Disallow deleting variables
    // https://eslint.org/docs/rules/no-delete-var
    'no-delete-var': 'error',
    // Disallow division operators explicitly at the beginning of regular expressions
    // https://eslint.org/docs/rules/no-div-regex
    'no-div-regex': 'error',
    // Disallow `else` blocks after `return` statements in `if` statements
    // https://eslint.org/docs/rules/no-else-return
    'no-else-return': ['error', { allowElseIf: false }],
    // Disallow empty block statements
    // https://eslint.org/docs/rules/no-empty
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Disallow empty functions
    // https://eslint.org/docs/rules/no-empty-function
    // Turned off in favor of @typescript-eslint/no-empty-function
    'no-empty-function': ['off', { allow: [] }],
    // Disallow `null` comparisons without type-checking operators
    // https://eslint.org/docs/rules/no-eq-null
    // 'eqeqeq' is more powerful and can enforce the same thing
    'no-eq-null': 'off',
    // Disallow the use of `eval()`
    // https://eslint.org/docs/rules/no-eval
    'no-eval': ['error', { allowIndirect: false }],
    // Disallow extending native types
    // https://eslint.org/docs/rules/no-extend-native
    'no-extend-native': 'error',
    // Disallow unnecessary calls to `.bind()`
    // https://eslint.org/docs/rules/no-extra-bind
    'no-extra-bind': 'error',
    // Disallow unnecessary boolean casts
    // https://eslint.org/docs/rules/no-extra-boolean-cast
    'no-extra-boolean-cast': ['error', { enforceForLogicalOperands: false }],
    // Disallow unnecessary labels
    // https://eslint.org/docs/rules/no-extra-label
    'no-extra-label': 'error',
    // Disallow unnecessary semicolons
    // https://eslint.org/docs/rules/no-extra-semi
    // Turned off in favor of @typescript-eslint/no-extra-semi
    'no-extra-semi': 'off',
    // Disallow leading or trailing decimal points in numeric literals
    // https://eslint.org/docs/rules/no-floating-decimal
    'no-floating-decimal': 'error',
    // Disallow assignments to native objects or read-only global variables
    // https://eslint.org/docs/rules/no-global-assign
    'no-global-assign': ['error', { exceptions: [] }],
    // Disallow shorthand type conversions
    // https://eslint.org/docs/rules/no-implicit-coercion
    // Do not want to enforce as shorthand can be convenient
    'no-implicit-coercion': [
      'off',
      {
        boolean: true,
        number: true,
        string: true,
        disallowTemplateShorthand: false,
        allow: [],
      },
    ],
    // Disallow declarations in the global scope
    // https://eslint.org/docs/rules/no-implicit-globals
    // Do not want to enforce
    'no-implicit-globals': ['off', { lexicalBindings: false }],
    // Disallow the use of `eval()`-like methods
    // https://eslint.org/docs/rules/no-implied-eval
    'no-implied-eval': 'error',
    // Disallow inline comments after code
    // https://eslint.org/docs/rules/no-inline-comments
    // Want to allow inline comments
    'no-inline-comments': 'off',
    // Disallow `this` keywords outside of classes or class-like objects
    // https://eslint.org/docs/rules/no-invalid-this
    // Want to be able to use `this` inside functions
    // Turned off in favor of @typescript-eslint/no-invalid-this
    'no-invalid-this': ['off', { capIsConstructor: true }],
    // Disallow the use of the `__iterator__` property
    // https://eslint.org/docs/rules/no-iterator
    'no-iterator': 'error',
    // Disallow labels that share a name with a variable
    // https://eslint.org/docs/rules/no-label-var
    'no-label-var': 'error',
    // Disallow labeled statements
    // https://eslint.org/docs/rules/no-labels
    'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
    // Disallow unnecessary nested bloc
    // https://eslint.org/docs/rules/no-lone-blocks
    'no-lone-blocks': 'error',
    // Disallow `if` statements as the only statement in `else` blocks
    // https://eslint.org/docs/rules/no-lonely-if
    'no-lonely-if': 'error',
    // Disallow function declarations that contain unsafe references inside loop statements
    // https://eslint.org/docs/rules/no-loop-func
    // Turned off in favor of @typescript-eslint/no-loop-func
    'no-loop-func': 'off',
    // Disallow magic numbers
    // https://eslint.org/docs/rules/no-magic-numbers
    // Turned off in favor of @typescript-eslint/no-magic-numbers
    'no-magic-numbers': [
      'off',
      {
        ignore: [1],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true,
        detectObjects: false,
      },
    ],
    // Disallow mixed binary operators
    // https://eslint.org/docs/rules/no-mixed-operators
    // FIXME: May cause issues with prettier- turn off if so
    'no-mixed-operators': [
      'error',
      {
        groups: [
          ['%', '**'],
          ['%', '+'],
          ['%', '-'],
          ['%', '*'],
          ['%', '/'],
          ['/', '*'],
          ['&', '|', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!=='],
          ['&&', '||'],
        ],
        allowSamePrecedence: false,
      },
    ],
    // Disallow use of chained assignment expressions
    // https://eslint.org/docs/rules/no-multi-assign
    'no-multi-assign': ['error', { ignoreNonDeclaration: false }],
    // Disallow multiline strings
    // https://eslint.org/docs/rules/no-multi-str
    'no-multi-str': 'error',
    // Disallow negated conditions
    // https://eslint.org/docs/rules/no-negated-condition
    // Want to allow negated conditions
    'no-negated-condition': 'off',
    // Disallow nested ternary expressions
    // https://eslint.org/docs/rules/no-nested-ternary
    // Turned off in favor of unicorn/no-nested-ternary
    'no-nested-ternary': 'off',
    // Disallow `new` operators outside of assignments or comparisons
    // https://eslint.org/docs/rules/no-new
    'no-new': 'error',
    // Disallow `new` operators with the `Function` object
    // https://eslint.org/docs/rules/no-new-func
    'no-new-func': 'error',
    // Disallow `Object` constructors
    // https://eslint.org/docs/rules/no-new-object
    'no-new-object': 'error',
    // Disallow `new` operators with the `String`, `Number`, and `Boolean` objects
    // https://eslint.org/docs/rules/no-new-wrappers
    'no-new-wrappers': 'error',
    // Disallow `\8` and `\9` escape sequences in string literals
    // https://eslint.org/docs/rules/no-nonoctal-decimal-escape
    'no-nonoctal-decimal-escape': 'error',
    // Disallow octal literals
    // https://eslint.org/docs/rules/no-octal
    'no-octal': 'error',
    // Disallow octal escape sequences in string literals
    // https://eslint.org/docs/rules/no-octal-escape
    'no-octal-escape': 'error',
    // Disallow reassigning `function` parameters
    // https://eslint.org/docs/rules/no-param-reassign
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'acc', // for reduce accumulators
          'accumulator', // for reduce accumulators
          'e', // for e.returnvalue
          'req', // for Express requests
          'request', // for Express requests
          'res', // for Express responses
          'response', // for Express responses
          'staticContext', // for ReactRouter context
        ],
      },
    ],
    // Disallow the unary operators `++` and `--`
    // https://eslint.org/docs/rules/no-plusplus
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    // Disallow the use of the `__proto__` property
    // https://eslint.org/docs/rules/no-proto
    'no-proto': 'error',
    // Disallow variable redeclaration
    // https://eslint.org/docs/rules/no-redeclare
    // Turned off in favor of @typescript-eslint/no-redeclare
    'no-redeclare': 'off',
    // Disallow multiple spaces in regular expressions
    // https://eslint.org/docs/rules/no-regex-spaces
    'no-regex-spaces': 'error',
    // Disallow specified names in exports
    // https://eslint.org/docs/rules/no-restricted-exports
    'no-restricted-exports': [
      'error',
      {
        restrictedNamedExports: [
          'default', // Use `export default` to provide a default export
          'then', // This will cause tons of confusion when your module is dynamically `
          //          import()`ed and will break in most node ESM versions
        ],
      },
    ],
    // Disallow specified global variables
    // https://eslint.org/docs/rules/no-restricted-globals
    'no-restricted-globals': [
      'error',
      {
        name: 'isFinite',
        message:
          'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
      },
      {
        name: 'isNaN',
        message:
          'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
      },
    ],
    // Disallow specified modules when loaded by `import`
    // https://eslint.org/docs/rules/no-restricted-imports
    // Turned off in favor of @typescript-eslint/no-restricted-imports
    'no-restricted-imports': [
      'off',
      {
        paths: [
          {
            name: 'underscore',
            message: 'Please use `lodash` instead of `underscore`',
          },
        ],
        patterns: [],
      },
    ],
    // Disallow certain properties on certain objects
    // https://eslint.org/docs/rules/no-restricted-properties
    'no-restricted-properties': [
      'error',
      {
        object: 'arguments',
        property: 'callee',
        message: 'arguments.callee is deprecated',
      },
      {
        property: '__defineGetter__',
        message: 'Please use Object.defineProperty instead.',
      },
      {
        property: '__defineSetter__',
        message: 'Please use Object.defineProperty instead.',
      },
    ],
    // Disallow specified syntax
    // https://eslint.org/docs/rules/no-restricted-syntax
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      // {
      //   selector: 'ForOfStatement',
      //   message:
      //     'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
      // },
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
    ],
    // Disallow assignment operators in `return` statements
    // https://eslint.org/docs/rules/no-return-assign
    'no-return-assign': ['error', 'always'],
    // Disallow unnecessary `return await`
    // https://eslint.org/docs/rules/no-return-await
    'no-return-await': 'error',
    // Disallow `javascript:` urls
    // https://eslint.org/docs/rules/no-script-url
    'no-script-url': 'error',
    // Disallow comma operators
    // https://eslint.org/docs/rules/no-sequences
    'no-sequences': 'error',
    // Disallow variable declarations from shadowing variables declared in the outer scope
    // https://eslint.org/docs/rules/no-shadow
    // Turned off in favor of @typescript-eslint/no-shadow
    'no-shadow': ['off', { builtinGlobals: true, hoist: 'functions', allow: [] }],
    // Disallow identifiers from shadowing restricted names
    // https://eslint.org/docs/rules/no-shadow-restricted-names
    'no-shadow-restricted-names': 'error',
    // Disallow ternary operators
    // https://eslint.org/docs/rules/no-ternary
    // Want to allow ternary operators
    'no-ternary': 'off',
    // Disallow throwing literals as exceptions
    // https://eslint.org/docs/rules/no-throw-literal
    'no-throw-literal': 'error',
    // Disallow initializing variables to `undefined`
    // https://eslint.org/docs/rules/no-undef-init
    'no-undef-init': 'error',
    // Disallow the use of `undefined` as an identifier
    // https://eslint.org/docs/rules/no-undefined
    // Off as other rules prevent shadowing, and typescript suggest using undefined rather than null
    'no-undefined': 'off',
    // Disallow dangling underscores in identifiers
    // https://eslint.org/docs/rules/no-underscore-dangle
    // Off as we use underscore dangle (not neccessarily for private members)
    'no-underscore-dangle': [
      'off',
      {
        allow: [],
        allowAfterSuper: false,
        allowAfterThis: false,
        allowAfterThisConstructor: false,
        allowFunctionParams: true,
        enforceInMethodNames: true,
      },
    ],
    // Disallow ternary operators when simpler alternatives exist
    // https://eslint.org/docs/rules/no-unneeded-ternary
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    // Disallow unused expressions
    // https://eslint.org/docs/rules/no-unused-expressions
    // Turned off in favor of @typescript-eslint/no-unused-expressions
    'no-unused-expressions': [
      'off',
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false,
        enforceForJSX: true,
      },
    ],
    // Disallow unused labels
    // https://eslint.org/docs/rules/no-unused-labels
    'no-unused-labels': 'error',
    // Disallow unnecessary calls to `.call()` and `.apply()`
    // https://eslint.org/docs/rules/no-useless-call
    'no-useless-call': 'error',
    // Disallow unnecessary `catch` clauses
    // https://eslint.org/docs/rules/no-useless-catch
    'no-useless-catch': 'error',
    // Disallow unnecessary computed property keys in objects and classes
    // https://eslint.org/docs/rules/no-useless-computed-key
    'no-useless-computed-key': ['error', { enforceForClassMembers: true }],
    // Disallow unnecessary concatenation of literals or template literals
    // https://eslint.org/docs/rules/no-useless-concat
    'no-useless-concat': 'error',
    // Disallow unnecessary constructors
    // https://eslint.org/docs/rules/no-useless-constructor
    // Turned off in favor of @typescript-eslint/no-useless-constructor
    'no-useless-constructor': 'off',
    // Disallow unnecessary escape characters
    // https://eslint.org/docs/rules/no-useless-escape
    'no-useless-escape': 'error',
    // Disallow renaming import, export, and destructured assignments to the same name
    // https://eslint.org/docs/rules/no-useless-rename
    'no-useless-rename': [
      'error',
      {
        ignoreDestructuring: false,
        ignoreExport: false,
        ignoreImport: false,
      },
    ],
    // Disallow redundant return statements
    // https://eslint.org/docs/rules/no-useless-return
    'no-useless-return': 'error',
    // Require `let` or `const` instead of `var`
    // https://eslint.org/docs/rules/no-var
    'no-var': 'error',
    // Disallow `void` operators
    // https://eslint.org/docs/rules/no-void
    'no-void': ['error', { allowAsStatement: true }],
    // Disallow specified warning terms in comments
    // https://eslint.org/docs/rules/no-warning-comments
    'no-warning-comments': ['warn', { terms: ['todo', 'fixme', 'xxx'], location: 'anywhere' }],
    // Disallow `with` statements
    // https://eslint.org/docs/rules/no-with
    'no-with': 'error',
    // Require or disallow method and property shorthand syntax for object literals
    // https://eslint.org/docs/rules/object-shorthand
    'object-shorthand': [
      'error',
      'always',
      {
        avoidExplicitReturnArrows: false,
        avoidQuotes: true,
        ignoreConstructors: false,
      },
    ],
    // Enforce variables to be declared either together or separately in functions
    // https://eslint.org/docs/rules/one-var
    'one-var': ['error', 'never'],
    // Require or disallow newlines around variable declarations
    // https://eslint.org/docs/rules/one-var-declaration-per-line
    'one-var-declaration-per-line': ['error', 'always'],
    // Require or disallow assignment operator shorthand where possible
    // https://eslint.org/docs/rules/operator-assignment
    'operator-assignment': ['error', 'always'],
    // Require using arrow functions for callbacks
    // https://eslint.org/docs/rules/prefer-arrow-callback
    'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
    // Require `const` declarations for variables that are never reassigned after declared
    // https://eslint.org/docs/rules/
    'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
    // Require destructuring from arrays and/or objects
    // https://eslint.org/docs/rules/prefer-destructuring
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: true,
          object: true,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    // Disallow the use of `Math.pow` in favor of the `**` operator
    // https://eslint.org/docs/rules/prefer-exponentiation-operator
    'prefer-exponentiation-operator': 'error',
    // Enforce using named capture group in regular expression
    // https://eslint.org/docs/rules/prefer-named-capture-group
    'prefer-named-capture-group': 'off',
    // Disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and
    //  hexadecimal literals
    // https://eslint.org/docs/rules/prefer-numeric-literals
    'prefer-numeric-literals': 'error',
    // Disallow use of `Object.prototype.hasOwnProperty.call()` and prefer use of
    //  `Object.hasOwn()`
    // https://eslint.org/docs/rules/prefer-object-has-own
    // Off as not using ES2022
    'prefer-object-has-own': 'off',
    // Disallow using Object.assign with an object literal as the first argument and prefer
    //  the use of object spread instead.
    // https://eslint.org/docs/rules/prefer-object-spread
    'prefer-object-spread': 'error',
    // Require using Error objects as Promise rejection reasons
    // https://eslint.org/docs/rules/prefer-promise-reject-errors
    'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
    // Disallow use of the `RegExp` constructor in favor of regular expression literals
    // https://eslint.org/docs/rules/prefer-regex-literals
    'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
    // Require rest parameters instead of `arguments`
    // https://eslint.org/docs/rules/prefer-rest-params
    'prefer-rest-params': 'error',
    // Require spread operators instead of `.apply()`
    // https://eslint.org/docs/rules/prefer-spread
    'prefer-spread': 'error',
    // Require template literals instead of string concatenation
    // https://eslint.org/docs/rules/
    'prefer-template': 'error',
    // Require quotes around object literal property names
    // https://eslint.org/docs/rules/quote-props
    'quote-props': ['error', 'as-needed', { keywords: false, unnecessary: true, numbers: false }],
    // Enforce the consistent use of the radix argument when using `parseInt()`
    // https://eslint.org/docs/rules/radix
    radix: ['error', 'always'],
    // Disallow async functions which have no `await` expression
    // https://eslint.org/docs/rules/require-await
    // This is a bad rule according to airbnb
    'require-await': 'off',
    // Enforce the use of `u` flag on RegExp
    // https://eslint.org/docs/rules/require-unicode-regexp
    'require-unicode-regexp': 'error',
    // Require generator functions to contain `yield`
    // https://eslint.org/docs/rules/require-yield
    'require-yield': 'error',
    // Enforce sorted import declarations within modules
    // https://eslint.org/docs/rules/sort-imports
    // TODO: May wish to disable this rule if it causes issues
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'single', 'all', 'multiple'],
        allowSeparatedGroups: true,
      },
    ],
    // Require object keys to be sorted
    // https://eslint.org/docs/rules/sort-keys
    // Off as often there is a more sensible order than alphabetical
    'sort-keys': ['off', 'asc', { caseSensitive: false, minKeys: 2, natural: true }],
    // Require variables within the same declaration block to be sorted
    // https://eslint.org/docs/rules/sort-vars
    'sort-vars': ['off', { ignoreCase: true }],
    // Enforce consistent spacing after the `//` or `/*` in a comment
    // https://eslint.org/docs/rules/spaced-comment
    'spaced-comment': [
      'error',
      'always',
      {
        line: {
          exceptions: ['-', '+'],
          markers: ['=', '!', '/'],
          // space above to support sprockets directives, slash for TS /// comments
        },
        block: {
          exceptions: ['-', '+'],
          markers: ['=', '!', ':', '::'],
          // space above to support sprockets directives and flow comment types
          balanced: true,
        },
      },
    ],
    // Require or disallow strict mode directives
    // https://eslint.org/docs/rules/strict
    // babel and TS already enforce this
    strict: ['error', 'never'],
    // Require symbol descriptions
    // https://eslint.org/docs/rules/symbol-description
    'symbol-description': 'error',
    // Require `var` declarations be placed at the top of their containing scope
    // https://eslint.org/docs/rules/vars-on-top
    'vars-on-top': 'error',
    // Require or disallow "Yoda" conditions
    // https://eslint.org/docs/rules/yoda
    yoda: ['error', 'never', { exceptRange: false, onlyEquality: false }],
  },
};
