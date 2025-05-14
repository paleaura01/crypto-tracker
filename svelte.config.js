// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    typescript: {
      config: (tsconfig) => {
        tsconfig.include = [
          ...tsconfig.include,
          'src/app.d.ts'
        ];
        return tsconfig;
      }
    }
  }
};
