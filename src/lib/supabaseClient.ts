// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const STORAGE_KEY = 'sb-session';
const inMemoryStorage = new Map<string, string>();

const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return inMemoryStorage.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      inMemoryStorage.set(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      inMemoryStorage.delete(key);
    }
  }
};

function localStorageAccessible(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAdapter = localStorageAccessible()
  ? customStorage
  : {
      getItem: (key: string) => inMemoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => inMemoryStorage.set(key, value),
      removeItem: (key: string) => inMemoryStorage.delete(key)
    };

if (!PUBLIC_SUPABASE_URL) throw new Error('PUBLIC_SUPABASE_URL is required');
if (!PUBLIC_SUPABASE_ANON_KEY) throw new Error('PUBLIC_SUPABASE_ANON_KEY is required');

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
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
        Pragma: 'no-cache',
        Expires: '0'
      }
    }
  }
);
