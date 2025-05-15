// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

//
// 1) Early bail-out for Chrome DevTools /.well-known probes
//
const ignoreWellKnown: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/.well-known/')) {
    return new Response(null, { status: 204 });
  }
  return resolve(event);
};

//
// 2) Initialize Supabase SSR client + log incoming cookies & session
//
const initSupabase: Handle = async ({ event, resolve }) => {
  // build SSR client, wired to SvelteKit's cookie API
  const supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => event.cookies.get(name),
        set: (name, value, options) => {
          console.log(`[hooks] setting cookie`, name, value, options);
          event.cookies.set(name, value, { path: '/', ...options });
        }
      }
    }
  );
  event.locals.supabase = supabase;

  // immediately pull the session so we can log it
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[hooks] existing session on incoming request:', session);
  event.locals.session = session;

  return resolve(event, {
    // preserve Supabase auth headers if you ever use them
    filterSerializedResponseHeaders: (name) =>
      ['content-range', 'x-supabase-api-version'].includes(name)
  });
};

//
// 3) Simple auth guard based on that session
//
const authGuard: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const session = event.locals.session;

  // redirect unauthenticated users into /auth/login
  if (!session && !path.startsWith('/auth/')) {
    throw redirect(303, '/auth/login');
  }

  // redirect logged-in folks away from the login/signup pages
  if (session && (path === '/auth/login' || path === '/auth/signup')) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

export const handle = sequence(
  ignoreWellKnown,
  initSupabase,
  authGuard
);
