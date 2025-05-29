/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte({ 
      hot: !process.env.VITEST,
      compilerOptions: {
        dev: true
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, './src/lib'),
      $types: resolve(__dirname, './src/lib/types'),
      $services: resolve(__dirname, './src/lib/services'),
      $utils: resolve(__dirname, './src/lib/utils'),
      $components: resolve(__dirname, './src/lib/components'),
      $stores: resolve(__dirname, './src/lib/stores')
    }
  }
});
