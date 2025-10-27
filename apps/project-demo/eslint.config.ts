import globals from 'globals';
import pluginJs from '@eslint/js';
import * as tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import pluginReact from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginPrettier from 'eslint-plugin-prettier'; // <-- Uncommented
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
export default tseslintPlugin.configs.base.extend(
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

  pluginJs.configs.recommended,
  tseslintPlugin.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-refresh': eslintPluginReactRefresh,
      'unused-imports': eslintPluginUnusedImports,
      prettier: pluginPrettier, // <-- Uncommented
      '@typescript-eslint': tseslintPlugin, // Explicitly declare the plugin
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: [
          './tsconfig.json',
          // './tsconfig.app.json', // Removed: file does not exist
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
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.json',
            // './tsconfig.app.json', // Removed: file does not exist
            './tsconfig.node.json',
          ],
        },
        node: true,
      },
    },
    rules: {
      // General rules
      'no-console': 'off',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-const': 'error',

      // React rules – import recommended sets directly from plugin
      ...pluginReact.configs.recommended.rules,
      //...pluginReact.configs['jsx-runtime'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // React Hooks - functionality is now included in eslint-plugin-react v7+
      // ...eslintPluginReactHooks.configs.recommended.rules, // Removed

      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Unused imports
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',

      // Prettier <-- Uncommented
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

  // Must be last: disables rules that conflict with Prettier
  eslintConfigPrettier,
);
