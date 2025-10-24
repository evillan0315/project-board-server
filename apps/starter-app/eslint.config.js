import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/compat'; // Added import for FlatCompat
const compat = new FlatCompat({
    baseDirectory: __dirname, // or process.cwd() for a more robust path in monorepos
});
export default tseslint.config({ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] }, { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } }, { languageOptions: { globals: globals.browser } }, pluginJs.configs.recommended, ...tseslint.configs.recommended, ...compat.configs.recommended, // Changed usage: use compat.configs.recommended
{
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        // You can add more React-specific rules here
    },
}, { ignores: ['dist'] });
