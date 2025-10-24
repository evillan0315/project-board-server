import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierPlugin from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Configuration for all TypeScript and JavaScript files
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Enable type-aware linting by providing paths to tsconfig files
        // The rootDir is essential for `project` paths to resolve correctly.
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    extends: [
      pluginJs.configs.recommended, // Basic ESLint recommended rules
      ...tseslint.configs.recommended, // TypeScript ESLint recommended rules
      ...tseslint.configs.stylistic, // TypeScript ESLint stylistic rules for code consistency

      react.configs.recommended, // React recommended rules
      react.configs['jsx-runtime'], // Rules for the new JSX transform (React 17+)

      // `eslint-config-prettier` should be the last config to turn off all ESLint rules
      // that are unnecessary or conflict with Prettier.
      configPrettier,
    ],

    plugins: {
      react,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      prettier: prettierPlugin, // Expose prettier plugin for rules
    },

    rules: {
      // Prettier integration: report prettier errors as ESLint errors
      'prettier/prettier': 'error',

      // React refresh for Vite HMR
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }, // Allows constant exports for better HMR
      ],

      // Unused imports/variables
      'no-unused-vars': 'off', // Disable the base ESLint no-unused-vars rule
      'unused-imports/no-unused-imports': 'error', // Enable unused-imports specific rule
      'unused-imports/no-unused-vars': [
        'warn',
        { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' },
      ],
      // The 'react/react-in-jsx-scope' and 'react/jsx-uses-react' rules are no longer needed
      // with React 17+ and the new JSX transform (enabled by `react.configs.jsx-runtime`).
    },
  },
  // Configuration for plain JavaScript files (no React/TypeScript specific rules here)
  {
    files: ['**/*.{js,mjs,cjs}'],
    excludedFiles: ['**/*.{ts,tsx,jsx}'], // Ensure these are not double-processed
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    extends: [
      pluginJs.configs.recommended,
      configPrettier,
    ],
    plugins: {
      'unused-imports': unusedImports,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { 'vars': 'all', 'varsIgnorePattern': '^_', 'args': 'after-used', 'argsIgnorePattern': '^_' },
      ],
    }
  },
  // Ensure common ignore patterns
  {
    ignores: ['dist', 'node_modules', '.yarn', 'coverage'],
  },
);