// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default [
  // Base JavaScript/TypeScript configuration
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Svelte configuration
  ...sveltePlugin.configs['flat/recommended'],
  
  {
    // Global ignores
    ignores: [
      'node_modules/',
      '.svelte-kit/',
      '.vercel/',
      'dist/',
      'build/',
      'suppress-warnings.cjs',
      // MCP tools have their own configs
      'mcp/tools/inspector/**',
      'mcp/servers/browser-tools-mcp/**',
      'mcp/servers/fetch-mcp/**',
      'mcp/servers/mcp-solver/**',
      // Build outputs and bundled files
      '**/*.bundle.js',
      '**/*.min.js',
      '**/build/**',
      '**/dist/**'
    ]
  },  {
    // TypeScript files
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      // Allow any type in some cases (can be refined later)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow console in development
      'no-console': 'warn'
    }
  },
    {
    // Svelte files
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte']
      },
      globals: {
        ...globals.browser,
        ...globals.es2022
      }
    },
    rules: {
      // Svelte-specific rules
      'svelte/require-each-key': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-undef': 'off', // Svelte compiler handles this
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
    }
  },
  
  {
    // Custom rule overrides
    files: ['global.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },  {
    // General rule customizations
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      // Allow console.log in development
      'no-console': 'warn',
      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      // Allow any type temporarily (should be refined)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow require imports in config files
      '@typescript-eslint/no-require-imports': 'off',
      // Relax some rules for development
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-escape': 'warn',
      'no-redeclare': 'warn',
      'no-undef': 'error',
      // Allow non-null assertions in optional chains for now
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      // Allow @ts-ignore comments for gradual migration
      '@typescript-eslint/ban-ts-comment': 'warn',
      // Allow irregular whitespace in some contexts
      'no-irregular-whitespace': 'warn'
    }
  },
  
  {
    // Config files can use require
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
    {
    // MCP server files have relaxed rules
    files: ['mcp/servers/**/*.js'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off' // These are server scripts with different patterns
    }
  }
];
