// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { createClient, type Session } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import cookie from 'cookie';

const inMemoryStorage = new Map<string, string>();

const storageAdapter = {
  getItem: (key: string) => inMemoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    inMemoryStorage.set(key, value);
  },
  removeItem: (key: string) => {
    inMemoryStorage.delete(key);
  }
};

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/.well-known/')) {
    return new Response(null, { status: 204 });
  }

  const rawCookie = event.request.headers.get('cookie') ?? '';
  const parsed = cookie.parse(rawCookie);
  let session: Session | null = null;

  if (parsed['sb-session']) {
    try {
      session = JSON.parse(decodeURIComponent(parsed['sb-session'])) as Session;
    } catch {
      session = null;
    }
  }

  event.locals.session = session;

  event.locals.supabase = createClient(
    env.SUPABASE_URL,
    publicEnv.PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        storage: storageAdapter,
        storageKey: 'sb-session',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      },
      global: {
        headers: { 'Cache-Control': 'no-cache', cookie: rawCookie }
      }
    }
  );

  event.locals.supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'Cache-Control': 'no-cache', cookie: rawCookie } }
    }
  );

  return await resolve(event);
};
