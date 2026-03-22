export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'dist/**', 'build/**'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        Blob: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        Intl: 'readonly',
        URLSearchParams: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        XPathResult: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        chrome: 'readonly',
        browser: 'readonly',
        crypto: 'readonly',
        globalThis: 'readonly',
        location: 'readonly',
      },
    },

    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
];
