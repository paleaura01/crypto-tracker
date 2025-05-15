// src/lib/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';  // full client with onAuthStateChange & signOut :contentReference[oaicite:0]{index=0}
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
);
