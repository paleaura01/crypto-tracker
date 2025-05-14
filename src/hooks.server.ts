// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private';

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

const init: Handle = async ({ event, resolve }) => {
  const { cookies } = event;

  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    { cookies, cookieOptions: { path: '/', secure: false } }
  );

  event.locals.supabaseAdmin = createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { cookies, cookieOptions: { path: '/', secure: false } }
  );

  // read the session from the cookie
  const { data } = await event.locals.supabase.auth.getSession();
  event.locals.session = data.session;

  return resolve(event);
};

const guard: Handle = async ({ event, resolve }) => {
  const { session } = event.locals;
  const path = event.url.pathname;
  const isAuth = path.startsWith('/auth/');

  if (!session && !isAuth) {
    throw redirect(303, '/auth/login');
  }
  if (session && (path === '/auth/login' || path === '/auth/signup')) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

export const handle = sequence(init, guard);
