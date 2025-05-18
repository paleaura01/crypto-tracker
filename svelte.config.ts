import adapter from '@sveltejs/adapter-vercel';
import { sveltePreprocess } from 'svelte-preprocess';
import { resolve } from 'path';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: sveltePreprocess({
    typescript: true,
    postcss: true
  }),
  kit: {
    adapter: adapter({ runtime: 'edge' }),
    alias: {
      $lib: resolve('src/lib'),
      '$lib/server': resolve('src/lib/server')
    }
  }
};

export default config;