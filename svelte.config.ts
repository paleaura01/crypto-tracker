import adapter from '@sveltejs/adapter-vercel';
import { sveltePreprocess } from 'svelte-preprocess';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: sveltePreprocess({
    typescript: true,
    postcss: true      // ← make sure this is enabled
  }),
  kit: {
    adapter: adapter({ runtime: 'edge' })
  }
};

export default config;
