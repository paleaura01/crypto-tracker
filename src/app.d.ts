import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Database } from './lib/server/types'; // your generated types

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database, 'public', any>;
    supabaseAdmin: SupabaseClient<any, 'service_role'>;
    session: Session | null;
  }
}
