import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export function getSupabaseAdminClient(event: RequestEvent) {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: event.cookies,
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      }
    }
  );
}
