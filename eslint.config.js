import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/prop-types': 'error',
      'react/react-in-jsx-scope': 'off',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use the approved banking API client instead of direct network requests.',
        },
        {
          name: 'XMLHttpRequest',
          message: 'Use the approved banking API client instead of direct network requests.',
        },
        {
          name: 'WebSocket',
          message: 'Use the approved banking API client instead of direct network requests.',
        },
        {
          name: 'EventSource',
          message: 'Use the approved banking API client instead of direct network requests.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message: 'Do not persist banking or personal data in browser storage.',
        },
        {
          object: 'window',
          property: 'sessionStorage',
          message: 'Do not persist banking or personal data in browser storage.',
        },
        {
          object: 'globalThis',
          property: 'localStorage',
          message: 'Do not persist banking or personal data in browser storage.',
        },
        {
          object: 'globalThis',
          property: 'sessionStorage',
          message: 'Do not persist banking or personal data in browser storage.',
        },
        {
          object: 'document',
          property: 'cookie',
          message: 'Do not access or store sensitive data in browser cookies.',
        },
        {
          object: 'navigator',
          property: 'sendBeacon',
          message: 'Do not send data outside the approved banking API client.',
        },
      ],
    },
  },
  {
    files: ['eslint.config.js', 'vite.config.js', 'postcss.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];