import js from '@eslint/js';

export default [
  {
    ignores: ['xacml/**', 'comformance/**', 'node_modules/**', '../node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      // Private class fields (#field) require class-methods-use-this to be relaxed
      'class-methods-use-this': 'off',

      // Allow continue in loops (used in XACML attribute iteration)
      'no-continue': 'off',

      // Allow for...of loops
      'no-restricted-syntax': [
        'error',
        { selector: 'LabeledStatement', message: 'Labels are not allowed.' },
        { selector: 'WithStatement', message: 'with is not allowed.' },
      ],

      // Allow reassignment of catch params (used in legacy XACML code)
      'no-param-reassign': ['error', { props: false }],

      // Pino uses { err } as first arg — allow object shorthand
      'object-shorthand': ['error', 'always'],

      // Template literals preferred over concatenation
      'prefer-template': 'error',

      'no-console': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];