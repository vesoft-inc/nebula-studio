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
        'project': 'tsconfig.json',
        'sourceType': 'module'
    },
    plugins: [
        "unused-imports",
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
        "no-unused-vars": "off",
		"unused-imports/no-unused-imports": "error",
		"unused-imports/no-unused-vars": [
			"warn",
			{ "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
		],
        'arrow-spacing': [
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
        'react/display-name': 'off',
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
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-this-alias': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
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
        'id-blacklist': 'error',
        'id-match': 'error',
        'import/no-extraneous-dependencies': 'error',
        'import/no-internal-modules': 'off',
        'import/order': 'error',
        'jsdoc/check-alignment': 'error',
        'jsdoc/newline-after-description': 'error',
        'max-classes-per-file': [
            'error',
            10
        ],
        'no-bitwise': 'off',
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
        'no-sequences': 'off',
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
        'no-multi-spaces': ['error', { ignoreEOLComments: true }],
        'comma-spacing': ['error'],
        'prefer-const': 'error',
        'prefer-object-spread': 'error',
        'react/display-name': 'error',
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
        'react/no-children-prop': 'error',
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
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'error',
        'react/require-render-return': 'error',
        'react/self-closing-comp': ['error'],
        'key-spacing': ['error', {
            'beforeColon': false,
            'afterColon': true
        }],
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
        'space-infix-ops': 'error',
        semi: 1,
        'block-spacing': 'error',
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
            'anonymous': 'never',
            'named': 'never',
            'asyncArrow': 'always'
        }],
        'object-curly-spacing': ['error', 'always'],
        'use-isnan': 'error',
        'valid-typeof': 'off',
        'jsx-quotes': ['error', 'prefer-double']
    }
};
