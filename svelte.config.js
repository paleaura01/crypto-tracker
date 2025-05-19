// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { sveltePreprocess } from 'svelte-preprocess';
import { resolve } from 'path';

export default {
  preprocess: sveltePreprocess({ typescript: true }),
  kit: {
    adapter: adapter(),          // <-- no `runtime: 'edge'` unless all your code is edge-safe
    alias: {
      $lib: resolve('src/lib'),
      '$lib/server': resolve('src/lib/server')
    }
  }
};
