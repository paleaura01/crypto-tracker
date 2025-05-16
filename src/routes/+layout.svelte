<!-- src/routes/+layout.svelte -->

<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

  // receive from +layout.server.ts
  export let data: {
    userEmail: string | null;
    isAdmin: boolean;
  };

  let theme: 'light' | 'dark' = 'light';
  let authUnsub: { unsubscribe(): void };

  async function handleSignOut() {
    // proxy through our own endpoint
    await fetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('theme');
    window.location.href = '/';
  }

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
    theme = t;
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  onMount(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) applyTheme(saved);
    else
      applyTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      );

    // subscribe to session changes (for UI updates)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // no client-side admin check needed
      }
      const { data } = supabase.auth.onAuthStateChange(
        (_e: AuthChangeEvent, newSession: Session | null) => {
          // session and userEmail/isAdmin remain server-driven
        }
      );
      authUnsub = data.subscription;
    });

    return () => authUnsub?.unsubscribe();
  });
</script>

<div class="min-h-screen flex flex-col">
  <nav>
    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
      CryptoTracker
    </div>

    <div class="flex space-x-6">
      <a href="/dashboard" class="hover:text-blue-600 dark:hover:text-blue-300">
        Dashboard
      </a>
      <a href="/portfolio" class="hover:text-blue-600 dark:hover:text-blue-300">
        Portfolio
      </a>
      <a href="/transactions" class="hover:text-blue-600 dark:hover:text-blue-300">
        Transactions
      </a>
      {#if data.isAdmin}
        <a href="/admin" class="text-red-500 dark:text-red-400 hover:underline">
          Admin
        </a>
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

      {#if data.userEmail}
        <span>
          {data.userEmail}
          {#if data.isAdmin}<span class="text-red-500"> (Admin)</span>{/if}
        </span>
        <button on:click={handleSignOut} class="btn btn-primary">
          Sign Out
        </button>
      {:else}
        <a href="/auth/login" class="text-blue-600 dark:text-blue-400 hover:underline">
          Login
        </a>
        <a href="/auth/signup" class="text-blue-600 dark:text-blue-400 hover:underline">
          Sign Up
        </a>
      {/if}
    </div>
  </nav>

  <main>
    <slot />
  </main>
</div>
