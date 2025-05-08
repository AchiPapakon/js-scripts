import { FlatCompat } from '@eslint/eslintrc';
import * as url from 'url';

// Plugins
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// import stylistic from '@stylistic/eslint-plugin'
// import pluginImport from 'eslint-plugin-import';
// import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
// import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import js from '@eslint/js';

import globals from 'globals';

const dirname = url.fileURLToPath(new URL('.', import.meta.url));
const compat = new FlatCompat({
    baseDirectory: dirname,
    resolvePluginsRelativeTo: dirname,
});

export default [
    {
        // It has to be separate https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
        ignores: [
            '**/build',
            '**/coverage',
            '**/temp',
            '**/public',
            '**/test',
            'scripts/aws.js',
            'src/serviceWorker.js',
        ],
    },
    {
        files: ['*.js', 'src/**/*.jsx'],
    },
    js.configs.recommended,
    ...compat.extends('airbnb'),
    ...compat.extends('plugin:react/recommended'),
    ...compat.extends('plugin:import/recommended'),
    ...compat.extends('plugin:jsx-a11y/recommended'),
    // pluginReact.configs.flat.recommended,
    // pluginImport.flatConfigs.recommended,
    // pluginJsxA11y.flatConfigs.recommended,
    {
        plugins: {
            'react-hooks': reactHooks,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.vitest,
                ...globals.commonjs,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            'arrow-parens': [2, 'as-needed'],
            'default-param-last': 1,
            'import/extensions': 0,
            'import/no-extraneous-dependencies': 0,
            'import/no-unresolved': 0,
            'import/prefer-default-export': 0,
            indent: [2, 4, { SwitchCase: 1 }],
            'react/jsx-indent': [2, 4],
            'react/jsx-indent-props': [2, 4],
            'jsx-a11y/click-events-have-key-events': 0,
            //     "jsx-a11y/label-has-for": 0,
            'jsx-a11y/no-static-element-interactions': 0,
            //     "linebreak-style": 0,
            //     "no-confusing-arrow": 0,
            'no-console': [1, { allow: ['error'] }],
            //     "no-mixed-operators": 0,
            //     "no-return-assign": 0,
            'no-unused-vars': 2,
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    trailingComma: 'es5',
                    printWidth: 120,
                    endOfLine: 'auto',
                    arrowParens: 'avoid',
                },
            ],
            'react/jsx-closing-bracket-location': 2,
            //     "react/jsx-filename-extension": 0,
            'react/jsx-props-no-spreading': 1,
            //     "react/no-array-index-key": 0,
            //     "react/no-did-mount-set-state": 0,
            'react/require-default-props': 0,
            'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],
        },
    },
    pluginPrettierRecommended,
];
