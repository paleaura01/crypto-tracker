// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

export default {
  extensions: ['.svelte'],
  preprocess: [
    preprocess({
      postcss: true
    })
  ],
  kit: {
    adapter: adapter(),
    typescript: {
      config: (tsconfig) => {
        tsconfig.include = tsconfig.include || [];
        tsconfig.include.push('src/app.d.ts');
        return tsconfig;
      }
    }
  }
};
