import globals from 'globals';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import type { Linter } from 'eslint'; // Corrected import for Linter type

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'build/**', '**/*.d.ts'],
  },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './tsconfig.node.json'], // Path to your tsconfig.json
        // Using "jsx": "react-jsx" in tsconfig.json means 'react/react-in-jsx-scope' is off by default
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser, // Browser environment globals (e.g., window, document)
        ...globals.node, // Node.js environment globals (e.g., process, __dirname) - useful for Vite config etc.
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // TypeScript ESLint Recommended and Stylistic rules
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs.stylistic.rules,

      // Custom TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn', // Warn for 'any', but allow
      '@typescript-eslint/no-unused-vars': 'off', // Handled by unused-imports plugin
      '@typescript-eslint/explicit-function-return-type': 'off', // Too verbose for React components
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn for non-null assertions
      '@typescript-eslint/consistent-type-imports': 'error', // Enforce type-only imports
      '@typescript-eslint/consistent-type-exports': 'error', // Enforce type-only exports
      '@typescript-eslint/interface-name-prefix': 'off', // No 'I' prefix required for interfaces
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too strict for some React patterns

      // General ESLint rules (apply to TS/JS)
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn for console.log, allow warn/error
      'no-debugger': 'error',
      'no-var': 'error', // Prefer `let`/`const` over `var`
      'prefer-const': 'error', // Prefer `const` where variable is not reassigned
      eqeqeq: ['error', 'always'], // Enforce strict equality

      // React rules (from recommended and jsx-runtime)
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // Enables the new JSX transform rules

      // Custom React rules
      'react/react-in-jsx-scope': 'off', // Not needed with the new JSX transform
      'react/prop-types': 'off', // Props types handled by TypeScript interfaces
      'react/self-closing-comp': ['error', { component: true, html: true }], // Enforce self-closing for empty components
      'react/jsx-key': 'error', // Enforce 'key' prop in loops
      'react/no-unescaped-entities': 'off', // Allow entities like ' without escaping

      // React Hooks rules
      ...reactHooks.configs.recommended.rules, // Basic hooks rules
      // Explicitly define here for clarity, though `recommended` already includes them
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies

      // Vite + React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }, // Recommended by Vite for HMR
      ],

      // Unused imports rules (more comprehensive than TS ESLint's no-unused-vars)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_', // Allow variables prefixed with _ to be unused
          args: 'after-used',
          argsIgnorePattern: '^_', // Allow arguments prefixed with _ to be unused
        },
      ],
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
  },

  // 4. Prettier integration
  prettierConfig, // Disables ESLint rules that conflict with Prettier
  {
    files: ['**/*.{ts,tsx,mjs,cjs}'], // Apply Prettier to all relevant code files
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto', printWidth: 100 }], // Enforce Prettier formatting errors
    },
  },
] as Linter.FlatConfig[]; // Add type assertion here
