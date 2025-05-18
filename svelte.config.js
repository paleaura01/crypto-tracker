// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { sveltePreprocess } from 'svelte-preprocess';
import { resolve } from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: sveltePreprocess({ typescript: true }),
  kit: {
    adapter: adapter({ runtime: 'edge' }),
    alias: {
      $lib: resolve('src/lib'),
      '$lib/server': resolve('src/lib/server')
    }
  }
};

export default config;
