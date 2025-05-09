import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import cookie from 'cookie';

// Create an in-memory storage fallback
const inMemoryStorage = new Map();

// Custom storage adapter that uses cookies and in-memory storage
const storageAdapter = {
  getItem: (key) => {
    return inMemoryStorage.get(key) || null;
  },
  setItem: (key, value) => {
    inMemoryStorage.set(key, value);
  },
  removeItem: (key) => {
    inMemoryStorage.delete(key);
  }
};

export async function handle({ event, resolve }) {
  try {

    if (event.url.pathname.startsWith('/.well-known/')) {
      return new Response(null, { status: 204 });
    }
  
    // otherwise continue as normal

    // Log the raw cookie header
    const rawCookie = event.request.headers.get('cookie') || '';
    // console.log('[hooks.server.js] Raw cookie header:', rawCookie);

    // Parse cookies using the cookie package
    const cookies = cookie.parse(rawCookie);
    // console.log('[hooks.server.js] Parsed cookies:', cookies);

    // Use the consistent cookie name 'sb-session'
    const sessionCookie = cookies['sb-session'];
    let session = null;
    if (sessionCookie) {
      try {
        session = JSON.parse(decodeURIComponent(sessionCookie));
        // console.log('[hooks.server.js] Parsed session from cookie:', session);
      } catch (err) {
        // console.error('[hooks.server.js] Error parsing session cookie:', err);
      }
    } else {
      // console.log('[hooks.server.js] No session cookie found.');
    }

    // Save the session on locals
    event.locals.session = session;

    // Create a Supabase client for auth using the public anon key
    event.locals.supabase = createClient(env.SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: storageAdapter,
        storageKey: 'sb-session',
        initialSession: session
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache',
          cookie: rawCookie
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        timeout: 20000
      }
    });

    // Create a separate Supabase client for admin/privileged actions
    event.locals.supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache',
          cookie: rawCookie
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        timeout: 20000
      }
    });

    const response = await resolve(event);
    return response;

  } catch (error) {
    // console.error('Hook error:', error);
    return new Response('Service temporarily unavailable', { status: 503 });
  }
}
