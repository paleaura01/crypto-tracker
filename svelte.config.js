// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { sveltePreprocess } from 'svelte-preprocess';
import { resolve } from 'path';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: sveltePreprocess({ typescript: true }),
  kit: {
    adapter: adapter({ 
      runtime: 'nodejs22.x',
      mcp: {
        enabled: true,
        servers: [
          {
            name: 'sequential-thinking',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-sequential-thinking']
          },
          {
            name: 'playwright',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-playwright@latest']
          },
          {
            name: 'win-cli',
            command: 'npx',
            args: ['-y', '@simonb97/server-win-cli']
          },
          {
            name: 'basic-memory',
            command: 'uvx',
            args: ['basic-memory', '--project', 'crypto-tracker', 'mcp']
          }
        ]
      }
    }),    alias: {
      $lib: resolve('src/lib'),
      '$lib/server': resolve('src/lib/server'),
      '$types': resolve('src/lib/types'),
      '$services': resolve('src/lib/services'),
      '$utils': resolve('src/lib/utils'),
      '$components': resolve('src/lib/components')
    }
  }
};
