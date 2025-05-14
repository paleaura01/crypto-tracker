import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function getSupabasePublicClient(event: RequestEvent) {
  return createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: event.cookies,
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      }
    }
  );
}
