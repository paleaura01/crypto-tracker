import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function createPublicClient(cookies: RequestEvent['cookies']): SupabaseClient {
  const cookieStore = {
    getAll() { return cookies.getAll(); },
    setAll(toSet: Array<{ name: string; value: string; options: CookieOptions }>) {
      toSet.forEach(({ name, value, options }) => cookies.set(name, value, options));
    }
  };

  return createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieStore }
  );
}
