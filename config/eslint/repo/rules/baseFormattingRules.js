export default {
  rules: {
    // Enforce linebreaks after opening and before closing array brackets
    // https://eslint.style/rules/js/array-bracket-newline
    '@stylistic/array-bracket-newline': ['error', 'consistent'],
    // Enforce consistent spacing inside array brackets
    // https://eslint.style/rules/js/array-bracket-spacing
    '@stylistic/array-bracket-spacing': [
      'error',
      'never',
      {
        singleValue: false,
        objectsInArrays: false,
        arraysInArrays: false,
      },
    ],
    // Enforce line breaks after each array element
    // https://eslint.style/rules/js/array-element-newline
    '@stylistic/array-element-newline': ['error', 'consistent'],
    // Require parentheses around arrow function arguments
    // https://eslint.style/rules/js/arrow-parens
    '@stylistic/arrow-parens': ['error', 'always', { requireForBlockBody: false }],
    // Enforce consistent spacing before and after the arrow in arrow functions
    // https://eslint.style/rules/js/arrow-spacing
    '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
    // Disallow or enforce spaces inside of blocks after opening block and before closing
    //  block
    // https://eslint.style/rules/js/block-spacing
    '@stylistic/block-spacing': ['error', 'always'],
    // Enforce consistent comma style
    // https://eslint.style/rules/js/comma-style
    '@stylistic/comma-style': [
      'error',
      'last',
      {
        exceptions: {
          ArrayExpression: false,
          ArrayPattern: false,
          ArrowFunctionExpression: false,
          CallExpression: false,
          FunctionDeclaration: false,
          FunctionExpression: false,
          ImportDeclaration: false,
          ObjectExpression: false,
          ObjectPattern: false,
          VariableDeclaration: false,
          NewExpression: false,
        },
      },
    ],
    // Disallow or enforce consistent spacing inside computed property brackets
    // https://eslint.style/rules/js/computed-property-spacing
    '@stylistic/computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],
    // Enforce consistent newlines before and after dots
    // https://eslint.style/rules/js/dot-location
    '@stylistic/dot-location': ['error', 'property'],
    // Require or disallow newline at the end of files
    // https://eslint.style/rules/js/eol-last
    '@stylistic/eol-last': ['error', 'always'],
    // Enforce line breaks between arguments of a function call
    // https://eslint.style/rules/js/function-call-argument-newline
    '@stylistic/function-call-argument-newline': ['error', 'consistent'],
    // Enforce consistent spacing around `*` operators in generator functions
    // https://eslint.style/rules/js/generator-star-spacing
    '@stylistic/generator-star-spacing': ['error', { before: false, after: true }],
    // Enforce the consistent use of either double or single quotes in JSX attributes
    // https://eslint.style/rules/js/jsx-quotes
    '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    // Enforce consistent spacing between keys and values in object literal properties
    // https://eslint.style/rules/js/key-spacing
    '@stylistic/key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      },
    ],
    // Enforce consistent linebreak style
    // https://eslint.style/rules/js/linebreak-style
    '@stylistic/linebreak-style': ['error', 'unix'],
    // Enforce a maximum line length
    // https://eslint.style/rules/js/max-len
    '@stylistic/max-len': [
      'warn',
      {
        code: 100,
        tabWidth: 2,
        comments: 100,
        ignoreComments: true,
        ignoreTrailingComments: false,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    // Enforce or disallow parentheses when invoking a constructor with no arguments
    // https://eslint.style/rules/js/new-parens
    '@stylistic/new-parens': ['error', 'always'],
    // Disallow mixed spaces and tabs for indentation
    // https://eslint.style/rules/js/no-mixed-spaces-and-tabs
    '@stylistic/no-mixed-spaces-and-tabs': 'error',
    // Disallow multiple spaces
    // https://eslint.style/rules/js/no-multi-spaces
    '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true, exceptions: { Property: true } }],
    // Disallow multiple empty lines
    // https://eslint.style/rules/js/no-multiple-empty-lines
    '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
    // Disallow all tabs
    // https://eslint.style/rules/js/no-tabs
    '@stylistic/no-tabs': ['error', { allowIndentationTabs: false }],
    // Disallow trailing whitespace at the end of lines
    // https://eslint.style/rules/js/no-trailing-spaces
    '@stylistic/no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
    // Disallow whitespace before properties
    // https://eslint.style/rules/js/no-whitespace-before-property
    '@stylistic/no-whitespace-before-property': 'error',
    // Enforce the location of single-line statements
    // https://eslint.style/rules/js/nonblock-statement-body-position
    '@stylistic/nonblock-statement-body-position': ['error', 'beside', { overrides: {} }],
    // Enforce consistent line breaks after opening and before closing braces
    // https://eslint.style/rules/js/object-curly-newline
    '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true }],
    // Enforce placing object properties on separate lines
    // https://eslint.style/rules/js/object-property-newline
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    // Enforce consistent linebreak style for operators
    // https://eslint.style/rules/js/operator-linebreak
    '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    // Require or disallow padding within blocks
    // https://eslint.style/rules/js/padded-blocks
    '@stylistic/padded-blocks': [
      'error',
      {
        blocks: 'never',
        classes: 'never',
        switches: 'never',
      },
      {
        allowSingleLineBlocks: true,
      },
    ],
    // Enforce the consistent use of either backticks, double, or single quotes
    // https://eslint.style/rules/js/quotes
    '@stylistic/quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
    // Enforce spacing between rest and spread operators and their expressions
    // https://eslint.style/rules/js/rest-spread-spacing
    '@stylistic/rest-spread-spacing': ['error', 'never'],
    // Enforce consistent spacing before and after semicolons
    // https://eslint.style/rules/js/semi-spacing
    '@stylistic/semi-spacing': ['error', { before: false, after: true }],
    // Enforce location of semicolons
    // https://eslint.style/rules/js/semi-style
    '@stylistic/semi-style': ['error', 'last'],
    // Enforce consistent spacing before blocks
    // https://eslint.style/rules/js/space-before-blocks
    '@stylistic/space-before-blocks': ['error', 'always'],
    // Enforce consistent spacing inside parentheses
    // https://eslint.style/rules/js/space-in-parens
    '@stylistic/space-in-parens': ['error', 'never'],
    // Enforce consistent spacing before or after unary operators
    // https://eslint.style/rules/js/space-unary-ops
    '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false, overrides: {} }],
    // Enforce spacing around colons of switch statements
    // https://eslint.style/rules/js/switch-colon-spacing
    '@stylistic/switch-colon-spacing': ['error', { after: true, before: false }],
    // Require or disallow spacing around embedded expressions of template strings
    // https://eslint.style/rules/js/template-curly-spacing
    '@stylistic/template-curly-spacing': ['error', 'never'],
    // Require or disallow spacing between template tags and their literals
    // https://eslint.style/rules/js/template-tag-spacing
    '@stylistic/template-tag-spacing': ['error', 'never'],
    // Require or disallow Unicode byte order mark (BOM)
    // https://eslint.org/docs/rules/unicode-bom
    'unicode-bom': ['error', 'never'],
    // Require parentheses around immediate `function` invocations
    // https://eslint.style/rules/js/wrap-iife
    '@stylistic/wrap-iife': ['error', 'inside', { functionPrototypeMethods: true }],
    // Require or disallow spacing around the `*` in `yield*` expressions
    // https://eslint.style/rules/js/yield-star-spacing
    '@stylistic/yield-star-spacing': ['error', { before: false, after: true }],
  },
};
