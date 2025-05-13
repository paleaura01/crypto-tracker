import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/private';

export function createAdminClient(cookies: RequestEvent['cookies']): SupabaseClient {
  // adapt cookie store API to CookieMethods:
  const cookieStore = {
    getAll() { return cookies.getAll(); },
    setAll(toSet: Array<{ name: string; value: string; options: CookieOptions }>) {
      toSet.forEach(({ name, value, options }) => cookies.set(name, value, options));
    }
  };

  return createServerClient(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { cookies: cookieStore }
  );
}
