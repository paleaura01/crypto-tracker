// env.d.ts
/// <reference types="@sveltejs/kit" />

declare module '$env/static/public' {
  export const PUBLIC_SUPABASE_URL: string;
  export const PUBLIC_SUPABASE_ANON_KEY: string;
  // add any other PUBLIC_* vars you use here
}

declare module '$env/static/private';
declare module '$env/dynamic/public';
declare module '$env/dynamic/private';
