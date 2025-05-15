import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

const ignoreWellKnown: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/.well-known/')) {
    return new Response(null, { status: 204 });
  }
  return resolve(event);
};

const initSupabase: Handle = async ({ event, resolve }) => {
  const supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => event.cookies.get(name),
        set: (name, value, options) => {
          console.log('[hooks] set cookie', name, value, options);
          event.cookies.set(name, value, { path: '/', ...options });
        }
      }
    }
  );
  event.locals.supabase = supabase;

  // ① Get the raw session from cookies (still needed for redirect logic)
  const {
    data: { session }
  } = await supabase.auth.getSession();
  console.log('[hooks] raw session', session);
  event.locals.session = session;

  // ② *Verify* that session by fetching the user server‐side
  const {
    data: { user },
    error: getUserError
  } = await supabase.auth.getUser();
  if (getUserError) {
    console.error('[hooks] getUser failed', getUserError);
    event.locals.user = null;
  } else {
    console.log('[hooks] verified user', user);
    event.locals.user = user;
  }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};

const authGuard: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const session = event.locals.session;

  if (!session && !path.startsWith('/auth/')) {
    throw redirect(303, '/auth/login');
  }
  if (session && (path === '/auth/login' || path === '/auth/signup')) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

export const handle = sequence(ignoreWellKnown, initSupabase, authGuard);
