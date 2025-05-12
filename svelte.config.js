import adapter from '@sveltejs/adapter-vercel';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: sveltePreprocess({ typescript: true }),
  kit: {
    adapter: adapter({ runtime: 'edge' })
    // …other settings…
  }
};
