// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// Merge base ESLint and TypeScript ESLint recommended configs
const baseConfig = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended
);

export default {
  ...baseConfig,
  // Ignore generated and external files
  ignorePatterns: [
    'node_modules/',
    '.svelte-kit/',
    'suppress-warnings.cjs'
  ],
  overrides: [
    {
      // Disable no-explicit-any rule in declaration files
      files: ['global.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
