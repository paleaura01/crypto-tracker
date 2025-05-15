import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
	// Locals that are added in hooks.server.ts
	namespace App {
		interface Locals {
			session: Session | null;
			supabase: SupabaseClient<Database>;
			supabaseAdmin: SupabaseClient<Database>;
		}
	}
}

export {}; // keep file a module
