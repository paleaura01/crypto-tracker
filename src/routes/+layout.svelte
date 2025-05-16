<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import '../app.css';
  import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

  let userEmail: string | undefined;
  let isAdmin = false;
  let theme: 'light' | 'dark' = 'light';
  let authUnsub: { unsubscribe(): void };

  async function checkAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId);
      isAdmin = !error && Array.isArray(data) && data.length > 0;
    } catch {
      isAdmin = false;
    }
  }

  export async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('sb-session');
      await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  }

  function applyTheme(t: 'light' | 'dark') {
    const root = document.documentElement;
    const body = document.body;
    if (t === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    localStorage.setItem('theme', t);
    theme = t;
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  onMount(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      applyTheme(prefers);
    }

    (async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user) {
        userEmail = session.user.email;
        await checkAdmin(session.user.id);
      }
      const { data } = supabase.auth.onAuthStateChange(
        async (_e: AuthChangeEvent, newSession: Session | null) => {
          if (newSession?.user) {
            userEmail = newSession.user.email;
            await checkAdmin(newSession.user.id);
          } else {
            userEmail = undefined;
            isAdmin = false;
          }
        }
      );
      authUnsub = data.subscription;
    })();

    return () => authUnsub.unsubscribe();
  });
</script>

<div class="min-h-screen flex flex-col">
  <!-- navbar now picks up bg/text from app.css -->
  <nav class="flex items-center justify-between p-4 shadow">
    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
      CryptoTracker
    </div>

    <div class="flex space-x-6">
      <a href="/dashboard" class="hover:text-blue-600 dark:hover:text-blue-300">Dashboard</a>
      <a href="/portfolio" class="hover:text-blue-600 dark:hover:text-blue-300">Portfolio</a>
      <a href="/transactions" class="hover:text-blue-600 dark:hover:text-blue-300">Transactions</a>
      {#if isAdmin}
        <a href="/admin" class="text-red-500 dark:text-red-400 hover:underline">Admin</a>
      {/if}
    </div>

    <div class="flex items-center space-x-4">
      <button
        on:click={toggleTheme}
        aria-label="Toggle theme"
        class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      >
        {#if theme === 'dark'}☀️{:else}🌙{/if}
      </button>

      {#if userEmail}
        <span>
          {userEmail}
          {#if isAdmin}<span class="text-red-500">(Admin)</span>{/if}
        </span>
        <button
          on:click={handleSignOut}
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Sign Out
        </button>
      {:else}
        <a href="/auth/login" class="text-blue-600 dark:text-blue-400 hover:underline">Login</a>
        <a href="/auth/signup" class="text-blue-600 dark:text-blue-400 hover:underline">Sign Up</a>
      {/if}
    </div>
  </nav>

  <main class="flex-1 container mx-auto px-4 py-6">
    <slot />
  </main>
</div>
