<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { invalidateAll, goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  // values come from +layout.server.ts on each SSR/invalidated load
  export let data: {
    userEmail: string | null;
    isAdmin: boolean;
  };

  // local theme state
  let theme: 'light' | 'dark' = 'light';

  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
    theme = t;
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  async function handleSignOut() {
    await fetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('theme');
    invalidateAll();
    goto('/', { replaceState: true });
  }

  onMount(() => {
    // initialize theme
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) applyTheme(saved);
    else
      applyTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      );

    // whenever auth state changes, re-run server load()
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      invalidateAll();
    });

    return () => subscription.unsubscribe();
  });
</script>

<div class="min-h-screen flex flex-col">
  <nav class="z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow">
    <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
      CryptoTracker
    </div>

    <div class="flex items-center space-x-6">
      <a href="/dashboard" class="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105">
        Dashboard
      </a>
      <a href="/portfolio" class="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105">
        Portfolio
      </a>
      <a href="/transactions" class="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105">
        Transactions
      </a>
      {#if data.isAdmin}
        <a href="/admin" class="text-lg font-semibold text-red-500 dark:text-red-400 hover:underline">
          Admin
        </a>
      {/if}
    </div>

    <div class="flex items-center space-x-4">
      <button
        on:click={toggleTheme}
        aria-label="Toggle theme"
        class="p-2 rounded dark:hover:bg-gray-500 transition"
      >
        {#if theme === 'dark'}🌙{:else}☀️{/if}
      </button>

      {#if data.userEmail}
        <span class="font-semibold">
          {data.userEmail}
          {#if data.isAdmin}<span class="text-red-500"> (Admin)</span>{/if}
        </span>
        <button on:click={handleSignOut} class="btn font-semibold btn-primary">
          Sign Out
        </button>
      {:else}
        <a href="/auth/login" class="btn font-semibold btn-primary">
          Login
        </a>
        <a href="/auth/signup" class="btn font-semibold btn-primary">
          Sign Up
        </a>
      {/if}
    </div>
  </nav>

  <main class="flex-1">
    <slot />
  </main>
</div>
