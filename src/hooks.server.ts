// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const initSupabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Only `get` and `set` are supported
        get: (name) => event.cookies.get(name),
        set: (name, value, options) => {
          event.cookies.set(name, value, { path: '/', ...options });
        }
      }
    }
  );

  return resolve(event);
};

// (You’ll also want to add your auth guard and ignore-well-known logic here)
export const handle = sequence(initSupabase /*, authGuard, etc. */);
