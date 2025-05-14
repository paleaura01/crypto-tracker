// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

//
// 1) Initialize Supabase SSR client on locals
//
const supabaseInit: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      // let the SSR helper set & read cookies for you
      cookies: event.cookies,
      cookieOptions: {
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  );

  return resolve(event);
};

//
// 2) Auth guard: allow only /auth/* for unauthenticated users
//
const authGuard: Handle = async ({ event, resolve }) => {
  const {
    data: { session }
  } = await event.locals.supabase.auth.getSession();

  event.locals.session = session;

  const path = event.url.pathname;
  const isAuthRoute = path.startsWith('/auth/');

  // if no session and not on an /auth/* page → send to /auth/login
  if (!session && !isAuthRoute) {
    throw redirect(303, '/auth/login');
  }

  // if session exists and user hits /auth/login or /auth/signup → send to dashboard
  if (session && (path === '/auth/login' || path === '/auth/signup')) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};

export const handle = sequence(supabaseInit, authGuard);
