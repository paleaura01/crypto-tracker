// src/routes/dashboard/+page.js
// This ensures the dashboard runs client-side only.
// (SvelteKit 2.0+ ignores `export const ssr = false` in +page.svelte files.)

export const ssr = false;
