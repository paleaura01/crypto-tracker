// src/lib/server/supabase.server.js
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Use a consistent cookie name for both client and server sessions
const STORAGE_KEY = 'sb-session';

const inMemoryStorage = new Map();

const customStorage = {
	getItem: (key) => {
		if (typeof window === 'undefined') return null;
		try {
			return window.localStorage.getItem(key);
		} catch (err) {
			console.error('[supabase.server.js] localStorage getItem error:', err);
			return inMemoryStorage.get(key) || null;
		}
	},
	setItem: (key, value) => {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(key, value);
		} catch (err) {
			console.error('[supabase.server.js] localStorage setItem error:', err);
			inMemoryStorage.set(key, value);
		}
	},
	removeItem: (key) => {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.removeItem(key);
		} catch (err) {
			console.error('[supabase.server.js] localStorage removeItem error:', err);
			inMemoryStorage.delete(key);
		}
	}
};

function localStorageAccessible() {
	if (typeof window === 'undefined') return false;
	try {
		const testKey = '__storage_test__';
		window.localStorage.setItem(testKey, 'test');
		window.localStorage.removeItem(testKey);
		return true;
	} catch (e) {
		return false;
	}
}

const storageAdapter = localStorageAccessible()
	? customStorage
	: {
			getItem: (key) => inMemoryStorage.get(key) || null,
			setItem: (key, value) => inMemoryStorage.set(key, value),
			removeItem: (key) => inMemoryStorage.delete(key)
	  };

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('PUBLIC_SUPABASE_URL is required');
if (!supabaseAnonKey) throw new Error('PUBLIC_SUPABASE_ANON_KEY is required');

console.log('[supabase.server.js] Initializing Supabase client with storage key:', STORAGE_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    storageKey: STORAGE_KEY,
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});
