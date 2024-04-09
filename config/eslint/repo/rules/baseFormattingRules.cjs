module.exports = {
  rules: {
    // Enforce linebreaks after opening and before closing array brackets
    // https://eslint.org/docs/rules/array-bracket-newline
    'array-bracket-newline': ['error', 'consistent'], // { multiline: true, minItems: null }],
    // Enforce consistent spacing inside array brackets
    // https://eslint.org/docs/rules/array-bracket-spacing
    'array-bracket-spacing': [
      'error',
      'never',
      {
        singleValue: false,
        objectsInArrays: false,
        arraysInArrays: false,
      },
    ],
    // Enforce line breaks after each array element
    // https://eslint.org/docs/rules/array-element-newline
    'array-element-newline': ['error', 'consistent'],
    // Require parentheses around arrow function arguments
    // https://eslint.org/docs/rules/arrow-parens
    'arrow-parens': ['error', 'always', { requireForBlockBody: false }],
    // Enforce consistent spacing before and after the arrow in arrow functions
    // https://eslint.org/docs/rules/arrow-spacing
    'arrow-spacing': ['error', { before: true, after: true }],
    // Disallow or enforce spaces inside of blocks after opening block and before closing
    //  block
    // https://eslint.org/docs/rules/block-spacing
    'block-spacing': ['error', 'always'],
    // Enforce consistent brace style for blocks
    // https://eslint.org/docs/rules/brace-style
    // Turned off in favor of @typescript-eslint/brace-style
    'brace-style': ['off', '1tbs', { allowSingleLine: true }],
    // Require or disallow trailing commas
    // https://eslint.org/docs/rules/comma-dangle
    // Turned off in favor of @typescript-eslint/comma-dangle
    'comma-dangle': [
      'off',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],
    // Enforce consistent spacing before and after commas
    // https://eslint.org/docs/rules/comma-spacing
    // Turned off in favor of @typescript-eslint/comma-spacing
    'comma-spacing': ['off', { before: false, after: true }],
    // Enforce consistent comma style
    // https://eslint.org/docs/rules/comma-style
    'comma-style': [
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
    // https://eslint.org/docs/rules/computed-property-spacing
    'computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],
    // Enforce consistent newlines before and after dots
    // https://eslint.org/docs/rules/dot-location
    'dot-location': ['error', 'property'],
    // Require or disallow newline at the end of files
    // https://eslint.org/docs/rules/eol-last
    'eol-last': ['error', 'always'],
    // Require or disallow spacing between function identifiers and their invocations
    // https://eslint.org/docs/rules/func-call-spacing
    'func-call-spacing': ['off', 'never'],
    // Enforce line breaks between arguments of a function call
    // https://eslint.org/docs/rules/function-call-argument-newline
    'function-call-argument-newline': ['error', 'consistent'],
    // Enforce consistent line breaks inside function parentheses
    // https://eslint.org/docs/rules/function-paren-newline
    // Off as Prettier deals with this
    'function-paren-newline': ['off', 'consistent'],
    // Enforce consistent spacing around `*` operators in generator functions
    // https://eslint.org/docs/rules/generator-star-spacing
    'generator-star-spacing': ['error', { before: false, after: true }],
    // Enforce the location of arrow function bodies
    // https://eslint.org/docs/rules/implicit-arrow-linebreak
    // Off as do not want to enforce either option. Prefer beside where fits, below where too long
    'implicit-arrow-linebreak': ['off', 'beside'],
    // Enforce consistent indentation
    // https://eslint.org/docs/rules/indent
    // Turned off to allow prettier to enforce indentation
    indent: [
      'off',
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        // MemberExpression: null,
        FunctionDeclaration: {
          parameters: 1,
          body: 1,
        },
        FunctionExpression: {
          parameters: 1,
          body: 1,
        },
        CallExpression: {
          arguments: 1,
        },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        offsetTernaryExpressions: false,
        // list derived from https://github.com/benjamn/ast-types/blob/HEAD/def/jsx.js
        ignoredNodes: [
          'JSXElement',
          'JSXElement > *',
          'JSXAttribute',
          'JSXIdentifier',
          'JSXNamespacedName',
          'JSXMemberExpression',
          'JSXSpreadAttribute',
          'JSXExpressionContainer',
          'JSXOpeningElement',
          'JSXClosingElement',
          'JSXFragment',
          'JSXOpeningFragment',
          'JSXClosingFragment',
          'JSXText',
          'JSXEmptyExpression',
          'JSXSpreadChild',
        ],
        ignoreComments: false,
      },
    ],
    // Enforce the consistent use of either double or single quotes in JSX attributes
    // https://eslint.org/docs/rules/jsx-quotes
    'jsx-quotes': ['error', 'prefer-single'],
    // Enforce consistent spacing between keys and values in object literal properties
    // https://eslint.org/docs/rules/key-spacing
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      },
    ],
    // Enforce consistent spacing before and after keywords
    // https://eslint.org/docs/rules/keyword-spacing
    // Turned off in favor of @typescript-eslint/keyword-spacing
    'keyword-spacing': [
      'off',
      {
        before: true,
        after: true,
        overrides: {
          return: { after: true },
          throw: { after: true },
          case: { after: true },
        },
      },
    ],
    // Enforce position of line comments
    // https://eslint.org/docs/rules/line-comment-position
    // Don't want to enforce a particular comment style
    'line-comment-position': ['off', { position: 'above' }],
    // Enforce consistent linebreak style
    // https://eslint.org/docs/rules/linebreak-style
    'linebreak-style': ['error', 'unix'],
    // Require empty lines around comments
    // https://eslint.org/docs/rules/lines-around-comment
    // Don't want to enforce a particular comment style
    'lines-around-comment': 'off',
    // Require or disallow an empty line between class members
    // https://eslint.org/docs/rules/lines-between-class-members
    // Turned off in favor of @typescript-eslint/lines-between-class-members
    'lines-between-class-members': ['off', 'always', { exceptAfterSingleLine: false }],
    // Enforce a maximum line length
    // https://eslint.org/docs/rules/max-len
    'max-len': [
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
    // Enforce a maximum number of statements allowed per line
    // https://eslint.org/docs/rules/max-statements-per-line
    'max-statements-per-line': ['off', { max: 1 }],
    // Enforce newlines between operands of ternary expressions
    // https://eslint.org/docs/rules/multiline-ternary
    // Want to be able to decide which is best
    'multiline-ternary': ['off', 'always'],
    // Enforce or disallow parentheses when invoking a constructor with no arguments
    // https://eslint.org/docs/rules/new-parens
    'new-parens': ['error', 'always'],
    // Require a newline after each call in a method chain
    // https://eslint.org/docs/rules/newline-per-chained-call
    // Off as conflicts with prettier
    'newline-per-chained-call': ['off', { ignoreChainWithDepth: 2 }],
    // Disallow unnecessary parentheses
    // https://eslint.org/docs/rules/no-extra-parens
    // Turned off in favor of @typescript-eslint/no-extra-parens
    'no-extra-parens': [
      'off',
      'all',
      {
        conditionalAssign: true,
        returnAssign: false,
        nestedBinaryExpressions: false,
        ignoreJSX: 'all', // delegate to eslint-plugin-react
        enforceForArrowConditionals: false,
        enforceForSequenceExpressions: false,
        enforceForNewInMemberExpressions: false,
        enforceForFunctionPrototypeMethods: false,
      },
    ],
    // Disallow mixed spaces and tabs for indentation
    // https://eslint.org/docs/rules/no-mixed-spaces-and-tabs
    'no-mixed-spaces-and-tabs': 'error',
    // Disallow multiple spaces
    // https://eslint.org/docs/rules/no-multi-spaces
    'no-multi-spaces': ['error', { ignoreEOLComments: true, exceptions: { Property: true } }],
    // Disallow multiple empty lines
    // https://eslint.org/docs/rules/no-multiple-empty-lines
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
    // Disallow all tabs
    // https://eslint.org/docs/rules/no-tabs
    'no-tabs': ['error', { allowIndentationTabs: false }],
    // Disallow trailing whitespace at the end of lines
    // https://eslint.org/docs/rules/no-trailing-spaces
    'no-trailing-spaces': ['error', { skipBlankLines: false, ignoreComments: false }],
    // Disallow whitespace before properties
    // https://eslint.org/docs/rules/no-whitespace-before-property
    'no-whitespace-before-property': 'error',
    // Enforce the location of single-line statements
    // https://eslint.org/docs/rules/nonblock-statement-body-position
    'nonblock-statement-body-position': ['error', 'beside', { overrides: {} }],
    // Enforce consistent line breaks after opening and before closing braces
    // https://eslint.org/docs/rules/object-curly-newline
    'object-curly-newline': ['error', { consistent: true, multiline: true }],
    // Enforce consistent spacing inside braces
    // https://eslint.org/docs/rules/object-curly-spacing
    // Turned off in favor of @typescript-eslint/object-curly-spacing
    'object-curly-spacing': ['off', 'always', { arraysInObjects: true, objectsInObjects: true }],
    // Enforce placing object properties on separate lines
    // https://eslint.org/docs/rules/object-property-newline
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    // Enforce consistent linebreak style for operators
    // https://eslint.org/docs/rules/operator-linebreak
    'operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    // Require or disallow padding within blocks
    // https://eslint.org/docs/rules/padded-blocks
    'padded-blocks': [
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
    // Require or disallow padding lines between statements
    // https://eslint.org/docs/rules/padding-line-between-statements
    // Do not want to require lines between each statement or not
    // Prefer @typescript-eslint/padding-line-between-statements if changing
    'padding-line-between-statements': 'off',
    // Enforce the consistent use of either backticks, double, or single quotes
    // https://eslint.org/docs/rules/quotes
    // Turned off in favor of @typescript-eslint/quotes
    quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    // Enforce spacing between rest and spread operators and their expressions
    // https://eslint.org/docs/rules/rest-spread-spacing
    'rest-spread-spacing': ['error', 'never'],
    // Require or disallow semicolons instead of ASI
    // https://eslint.org/docs/rules/semi
    // Turned off in favor of @typescript-eslint/semi
    semi: ['off', 'always', { omitLastInOneLineBlock: false }],
    // Enforce consistent spacing before and after semicolons
    // https://eslint.org/docs/rules/semi-spacing
    'semi-spacing': ['error', { before: false, after: true }],
    // Enforce location of semicolons
    // https://eslint.org/docs/rules/semi-style
    'semi-style': ['error', 'last'],
    // Enforce consistent spacing before blocks
    // https://eslint.org/docs/rules/space-before-blocks
    'space-before-blocks': ['error', 'always'],
    // Enforce consistent spacing before `function` definition opening parenthesis
    // https://eslint.org/docs/rules/space-before-function-paren
    // Turned off in favor of @typescript-eslint/space-before-function-paren
    'space-before-function-paren': [
      'off',
      { anonymous: 'always', named: 'never', asyncArrow: 'always' },
    ],
    // Enforce consistent spacing inside parentheses
    // https://eslint.org/docs/rules/space-in-parens
    'space-in-parens': ['error', 'never'],
    // Require spacing around infix operators
    // https://eslint.org/docs/rules/space-infix-ops
    // Turned off in favor of @typescript-eslint/space-infix-ops
    'space-infix-ops': ['off', { int32Hint: false }],
    // Enforce consistent spacing before or after unary operators
    // https://eslint.org/docs/rules/space-unary-ops
    'space-unary-ops': ['error', { words: true, nonwords: false, overrides: {} }],
    // Enforce spacing around colons of switch statements
    // https://eslint.org/docs/rules/switch-colon-spacing
    'switch-colon-spacing': ['error', { after: true, before: false }],
    // Require or disallow spacing around embedded expressions of template strings
    // https://eslint.org/docs/rules/template-curly-spacing
    'template-curly-spacing': ['error', 'never'],
    // Require or disallow spacing between template tags and their literals
    // https://eslint.org/docs/rules/template-tag-spacing
    'template-tag-spacing': ['error', 'never'],
    // Require or disallow Unicode byte order mark (BOM)
    // https://eslint.org/docs/rules/unicode-bom
    'unicode-bom': ['error', 'never'],
    // Require parentheses around immediate `function` invocations
    // https://eslint.org/docs/rules/wrap-iife
    'wrap-iife': ['error', 'inside', { functionPrototypeMethods: true }],
    // Require parenthesis around regex literals
    // https://eslint.org/docs/rules/wrap-regex
    // Don't want to enforce wrapping regexp
    'wrap-regex': 'off',
    // Require or disallow spacing around the `*` in `yield*` expressions
    // https://eslint.org/docs/rules/yield-star-spacing
    'yield-star-spacing': ['error', { before: false, after: true }],
  },
};
