// src/app.d.ts
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | null;
    }
    interface PageData {
      session: Session | null;
      isAdmin: boolean;
    }
  }
}

export {};
