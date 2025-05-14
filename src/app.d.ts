/// <reference types="@sveltejs/kit" />

import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare module '$env/static/public';
declare module '$env/static/private';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    session: Session | null;
  }
  interface PageData {
    session: Session | null;
  }
}
