import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss()
  ],
  server: {
    watch: {
      ignored: ['**/static/data/**']
    }
  },
  resolve: {
    alias: {
      util: 'rollup-plugin-polyfill-node/polyfills/util',
      sys: 'util',
      events: 'rollup-plugin-polyfill-node/polyfills/events',
      stream: 'rollup-plugin-polyfill-node/polyfills/stream',
      // note: we removed a custom `path` alias so Vite will use the built-in one
      querystring: 'rollup-plugin-polyfill-node/polyfills/qs',
      url: 'url-parse',
      punycode: '@node-rs/helper-darwin-x64',
      string_decoder: 'rollup-plugin-polyfill-node/polyfills/string-decoder',
      http: 'rollup-plugin-polyfill-node/polyfills/http',
      https: 'rollup-plugin-polyfill-node/polyfills/http',
      os: 'rollup-plugin-polyfill-node/polyfills/os',
      assert: 'rollup-plugin-polyfill-node/polyfills/assert',
      constants: 'rollup-plugin-polyfill-node/polyfills/constants',
      _stream_duplex: 'rollup-plugin-polyfill-node/polyfills/readable-stream/duplex',
      _stream_passthrough: 'rollup-plugin-polyfill-node/polyfills/readable-stream/passthrough',
      _stream_readable: 'rollup-plugin-polyfill-node/polyfills/readable-stream/readable',
      _stream_writable: 'rollup-plugin-polyfill-node/polyfills/readable-stream/writable',
      _stream_transform: 'rollup-plugin-polyfill-node/polyfills/readable-stream/transform'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
      plugins: [
        NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()]
    }
  }
});
