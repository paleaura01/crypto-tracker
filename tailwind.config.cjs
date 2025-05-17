/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',               // enable JIT for faster dev builds
  darkMode: 'class',         // toggle dark mode with .dark on <html>
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/app.html'
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
