// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const ignoreWellKnown: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/.well-known/')) {
    return new Response(null, { status: 204 });
  }
  return resolve(event);
};

const initClients: Handle = async ({ event, resolve }) => {
  // both clients automatically read/write event.cookies
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: event.cookies,
      cookieOptions: { path: '/' }
    }
  );

  event.locals.supabaseAdmin = createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: event.cookies,
      cookieOptions: { path: '/' }
    }
  );

  const {
    data: { session }
  } = await event.locals.supabase.auth.getSession();
  event.locals.session = session;

  return resolve(event);
};

const guard: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  if (!path.startsWith('/auth/') && !event.locals.session) {
    throw redirect(303, '/auth/login');
  }
  if (event.locals.session && (path === '/auth/login' || path === '/auth/signup')) {
    throw redirect(303, '/dashboard');
  }
  return resolve(event);
};

export const handle = sequence(ignoreWellKnown, initClients, guard);
