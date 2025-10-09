const js = require('@eslint/js');
const globals = require('globals');
const { defineConfig } = require('eslint/config');
const security = require('eslint-plugin-security');
const eslintPluginPrettier = require('eslint-plugin-prettier');

module.exports = defineConfig([
  {
    ignores: ['node_modules/', 'dist/', 'build/', '**/generated/'],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    plugins: {
      js,
      security,
      prettier: eslintPluginPrettier,
    },

    rules: {
      // Base recommended rules
      ...js.configs.recommended.rules,

      // Security plugin rules (pick the ones you want)
      ...security.configs.recommended.rules,

      // Your custom rule preferences
      'no-unused-vars': ['warn'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'object-shorthand': ['error', 'always'],
      'arrow-spacing': ['error', { before: true, after: true }],

      // Formatting-related
      'max-len': 'off',
      // 'comma-dangle': ['error', 'always-multiline'], // Handled by Prettier
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: 'off',

      complexity: ['warn', { max: 15 }],

      // Prettier integration
      'prettier/prettier': ['error'],
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Allow describe, it, expect, etc. in test files
      'no-undef': 'off',
    },
  },
  {
    files: ['src/core/interfaces/*.js'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);
