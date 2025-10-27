import globals from 'globals';
import pluginJs from '@eslint/js';
import * as tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import pluginReact from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginPrettier from 'eslint-plugin-prettier';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------------------------------------------------------------------
// ES module compatibility helpers
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// ESLint configuration
// -----------------------------------------------------------------------------
export default [
  {
    ignores: [
      'dist',
      'node_modules',
      '.next',
      '*.config.{js,ts,cjs}',
      'public',
      '.env',
      '.env.*',
      '*.d.ts',
      'coverage',
      'temp',
      'out',
    ],
  },

  // Recommended JavaScript rules from @eslint/js. This is an object.
  pluginJs.configs.recommended,

  // Recommended TypeScript rules from @typescript-eslint/eslint-plugin.
  // `recommended` is an object for flat config.
  tseslintPlugin.configs.recommended,

  // Recommended React rules from eslint-plugin-react.
  // These are objects for flat config.
  pluginReact.configs.recommended,
  pluginReact.configs['jsx-runtime'], // For React 17+ JSX transform without explicit React import

  {
    files: ['**/*.{ts,tsx}'],
    // Explicitly declare plugins used for rules within this specific config object.
    // Plugins for @typescript-eslint and eslint-plugin-react are implicitly handled
    // by their respective config objects at the top level, so no need to redeclare them here.
    plugins: {
      'react-refresh': eslintPluginReactRefresh,
      'unused-imports': eslintPluginUnusedImports,
      prettier: pluginPrettier,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './tsconfig.node.json',
        ],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.json',
            './tsconfig.node.json',
          ],
        },
        node: true,
      },
    },
    rules: {
      // General ESLint rules
      'no-console': 'off', // Allow console.log for development
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-const': 'error',

      // React-specific rules
      'react/react-in-jsx-scope': 'off', // Not needed for new JSX transform (React 17+)
      'react/prop-types': 'off', // Not needed with TypeScript prop validation

      // React Refresh rules (for Vite HMR)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript ESLint rules
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Too restrictive for common patterns
      '@typescript-eslint/no-explicit-any': 'off', // Allow `any` for flexibility when needed
      '@typescript-eslint/no-unused-vars': 'off', // Use `unused-imports` for better control

      // `eslint-plugin-unused-imports` rules for cleaner code
      'unused-imports/no-unused-imports': 'error', // Disallow unused imports
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Prettier rules for consistent formatting
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'lf',
          tabWidth: 2,
          semi: true,
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
        },
      ],
    },
  },

  // `eslint-config-prettier` should always be the last configuration
  // in the array to ensure it correctly disables all ESLint rules
  // that conflict with Prettier's formatting.
  eslintConfigPrettier,
];
