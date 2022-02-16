module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: [
        'plugin:react/recommended',
        'prettier',
        'prettier/@typescript-eslint',
    ],
    ignorePatterns: [
        'coverage',
        'coverage',
        'coverage'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        'project': ['./tsconfig.json'],
        'tsconfigRootDir': __dirname,
        'sourceType': 'module'
    },
    plugins: [
        'eslint-plugin-react',
        'eslint-plugin-import',
        'eslint-plugin-jsdoc',
        'eslint-plugin-prefer-arrow',
        '@typescript-eslint',
        'prettier',
    ],
    settings: {
        react: {
            version: 'detect'
        }
    },
    rules: {
        'arrow-spacing':[
            'error',
            {
                before: true,
                after: true,
            }
        ],
        'comma-dangle': ['error', 'only-multiline'],
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array'
            }
        ],
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    Object: {
                        message: 'Avoid using the `Object` type. Did you mean `object`?'
                    },
                    Function: {
                        message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.'
                    },
                    Boolean: {
                        message: 'Avoid using the `Boolean` type. Did you mean `boolean`?'
                    },
                    Number: {
                        message: 'Avoid using the `Number` type. Did you mean `number`?'
                    },
                    String: {
                        message: 'Avoid using the `String` type. Did you mean `string`?'
                    },
                    Symbol: {
                        message: 'Avoid using the `Symbol` type. Did you mean `symbol`?'
                    },
                    object: false
                }
            }
        ],
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/dot-notation': 'error',
        '@typescript-eslint/explicit-member-accessibility': [
            'off',
            {
                accessibility: 'explicit'
            }
        ],
        '@typescript-eslint/indent': [
            'error',
            2,
            {
                SwitchCase: 1,
                ArrayExpression: 1,
                CallExpression: { 'arguments': 1 },
                ObjectExpression: 1,
                ImportDeclaration: 1,
                flatTernaryExpressions: false,
            }
        ],
        '@typescript-eslint/member-delimiter-style': [
            'off',
            {
                multiline: {
                    delimiter: 'none',
                    requireLast: true
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false
                }
            }
        ],
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/naming-convention': [
            'error',
            { selector: 'typeLike', format: ['PascalCase', 'UPPER_CASE'], filter: { 'regex': '^(__String|[A-Za-z]+_[A-Za-z]+)$', match: false } },
            { selector: 'interface', format: ['PascalCase'], 'custom': { 'regex': '^I[A-Z][a-zA-Z0-9]*', match: true }, filter: { 'regex': '^I(Arguments|TextWriter|O([A-Z][a-z]+[A-Za-z]*)?)$', match: false } },
            { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], 'leadingUnderscore': 'allow', filter: { 'regex': '^(_{1,2}filename|_{1,2}dirname|_+|[A-Za-z]+_[A-Za-z]+)$', match: false } },
            { selector: 'function', format: ['camelCase', 'PascalCase'], 'leadingUnderscore': 'allow', filter: { 'regex': '^[A-Za-z]+_[A-Za-z]+$', match: false } },
            { selector: 'parameter', format: ['camelCase', 'PascalCase'], 'leadingUnderscore': 'allow', filter: { 'regex': '^(_+|[A-Za-z]+_[A-Z][a-z]+)$', match: false } },
            { selector: 'method', format: ['camelCase', 'PascalCase'], 'leadingUnderscore': 'allow', filter: { 'regex': '^[A-Za-z]+_[A-Za-z]+$', match: false } },
            { selector: 'memberLike', format: ['camelCase'], 'leadingUnderscore': 'allow', filter: { 'regex': '^[A-Za-z]+_[A-Za-z]+$', match: false } },
            { selector: 'enumMember', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], 'leadingUnderscore': 'allow', filter: { 'regex': '^[A-Za-z]+_[A-Za-z]+$', match: false } },
            { selector: 'property', format: null }
        ],
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-expressions': ['error', { "allowTernary": true, "allowShortCircuit": true }],
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/quotes': [
            'error',
            'single',
            { allowTemplateLiterals: true }
        ],
        '@typescript-eslint/semi': [
            'off',
            null
        ],
        '@typescript-eslint/triple-slash-reference': [
            'error',
            {
                path: 'always',
                types: 'prefer-import',
                lib: 'always'
            }
        ],
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-parens': [
            'off',
            'always'
        ],
        'brace-style': [
            'error',
            '1tbs'
        ],
        complexity: 'off',
        'constructor-super': 'error',
        eqeqeq: [
            'error',
            'smart'
        ],
        'guard-for-in': 'error',
        'id-blacklist': 'error',
        'id-match': 'error',
        'import/no-internal-modules': 'off',
        'sort-imports': 'error',
        'jsdoc/check-alignment': 'error',
        'jsdoc/check-indentation': 'error',
        'jsdoc/newline-after-description': 'error',
        'max-classes-per-file': [
            'error',
            10
        ],
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-cond-assign': 'error',
        'no-console': [
            'off',
            {
                allow: [
                    'time',
                    'timeEnd',
                    'timeLog',
                    'trace',
                    'assert',
                    'clear',
                    'count',
                    'countReset',
                    'group',
                    'groupEnd',
                    'table',
                    'debug',
                    'info',
                    'dirxml',
                    'groupCollapsed',
                    'Console',
                    'profile',
                    'profileEnd',
                    'timeStamp',
                    'context'
                ]
            }
        ],
        'no-debugger': 'error',
        'no-duplicate-case': 'error',
        'no-duplicate-imports': 'error',
        'no-empty': 'error',
        'no-eval': 'error',
        'no-extra-bind': 'error',
        'no-fallthrough': 'off',
        'no-invalid-this': 'off',
        'no-irregular-whitespace': 'off',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-redeclare': 'error',
        'no-return-await': 'error',
        'no-sequences': 'error',
        'no-shadow': [
            'off',
            {
                hoist: 'all'
            }
        ],
        'no-sparse-arrays': 'error',
        'no-template-curly-in-string': 'error',
        'no-throw-literal': 'error',
        'no-undef-init': 'error',
        'no-unsafe-finally': 'error',
        'no-unused-labels': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'one-var': [
            'error',
            'never'
        ],
        "no-multi-spaces": ["error", { ignoreEOLComments: true }],
        "comma-spacing": ["error"],
        'prefer-const': 'error',
        'prefer-object-spread': 'error',
        'radix': 'error',
        'react/display-name': 'error',
        'react/jsx-boolean-value': [
            'error', 
            'always'
        ],
        'react/jsx-curly-spacing': 'off',
        'react/jsx-equals-spacing': 'off',
        'react/jsx-key': 'error',
        'react/jsx-no-bind': [
            'error',
            {
                allowArrowFunctions: true
            }
        ],
        'react/jsx-no-comment-textnodes': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-target-blank': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/jsx-wrap-multilines': 'off',
        'react/no-children-prop': 'off',
        'react/no-danger-with-children': 'error',
        'react/no-deprecated': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/no-unsafe': 'off',
        'react/prop-types': 'error',
        'react/react-in-jsx-scope': 'error',
        'react/require-render-return': 'error',
        'react/self-closing-comp': ['error'],
        'space-in-parens': [
            'error',
            'never'
        ],
        'spaced-comment': [
            'error',
            'always',
            {
                markers: [
                    '/'
                ]
            }
        ],
        'key-spacing': ["error", { 
            "beforeColon": false,
            "afterColon": true
        }],
        'object-property-newline': ["error", { "allowAllPropertiesOnSameLine": true }],
        "space-infix-ops": "error",
        semi: 1,
        'block-spacing': "error",
        'space-before-blocks': "error",
        'space-before-function-paren':  ["error", "never"],
        'object-curly-spacing': ['error','always'],
        'use-isnan': 'error',
        'valid-typeof': 'off',
        'jsx-quotes': ['error', 'prefer-double'],
        'sort-imports': ['error', {
            ignoreCase: false,
            ignoreDeclarationSort: true,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
        }]
    }
};
