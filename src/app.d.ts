/// <reference types="@sveltejs/kit" />

import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      /** set by your hooks.server.ts */
      session: Session | null;
      /** your service-role Supabase client */
      supabaseAdmin: SupabaseClient;
    }
  }
}

// allow `import X from '*.svelte'`
declare module '*.svelte' {
  import { SvelteComponentTyped } from 'svelte';
  export default class Component<
    Props extends Record<string, any> = Record<string, any>,
    Events extends Record<string, any> = Record<string, any>,
    Slots extends Record<string, any> = Record<string, any>
  > extends SvelteComponentTyped<Props, Events, Slots> {}
}

// allow private env imports for server-only code
declare module '$env/static/private';

export {};
