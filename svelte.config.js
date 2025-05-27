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
            name: 'basic-memory',
            command: 'uvx',
            args: ['basic-memory', '--project', 'crypto-tracker', 'mcp']
          },
          {
            name: 'fetch',
            command: 'node',
            args: ['./mcp-servers/fetch-mcp/dist/index.js']
          },
          {
            name: 'solver',
            command: 'uv',
            args: ['--directory', './mcp-servers/mcp-solver', 'run', 'mcp-solver-z3']
          },
          {
            name: 'filesystem',
            command: 'uvx',
            args: [
              '--from',
              'git+https://github.com/modelcontextprotocol/servers.git#subdirectory=src/filesystem',
              'mcp-server-filesystem',
              '.'
            ]
          },          {
            name: 'time',
            command: 'uvx',
            args: ['mcp-server-time']
          },          {
            name: 'win-cli',
            command: 'npx',
            args: ['-y', '@simonb97/server-win-cli']
          }
        ]
      }
    }),
    alias: {
      $lib: resolve('src/lib'),
      '$lib/server': resolve('src/lib/server')
    }
  }
};
