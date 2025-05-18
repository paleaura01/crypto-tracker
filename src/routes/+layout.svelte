<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { invalidateAll, goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  export let data: { userEmail: string | null; isAdmin: boolean };

  // theme
  let theme: 'light' | 'dark' = 'light';
  function applyTheme(t: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', t === 'dark');
    localStorage.setItem('theme', t);
    theme = t;
  }
  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  // mobile menu
  let menuOpen = false;
  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  // sign-out
  async function handleSignOut() {
    await fetch('/auth/logout', { method: 'POST' });
    invalidateAll();
    goto('/', { replaceState: true });
  }

  onMount(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    applyTheme(
      saved ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light')
    );
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(() => invalidateAll());
    return () => subscription.unsubscribe();
  });
</script>

<div class="min-h-screen dark:bg-gray-900 flex flex-col">
  <!-- NAVBAR -->
  <nav class="shadow p-4 flex items-center justify-between bg-gray-50 text-gray-800 dark:text-gray-100 dark:bg-gray-700">
    <div class="flex items-center space-x-3">
      <button class="md:hidden p-2 text-2xl" on:click={toggleMenu} aria-label="Menu">
        {#if menuOpen}✕{:else}☰{/if}
      </button>
      <a href="/" class="text-3xl font-bold text-blue-600 dark:text-blue-400">
        CryptoTracker
      </a>
    </div>

    <div class="hidden md:flex items-center space-x-6">
      <a
        href="/dashboard"
        class="text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Dashboard</a>
      <a
        href="/portfolio"
        class="text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Portfolio</a>
      <a
        href="/transactions"
        class="text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Transactions</a>
      {#if data.isAdmin}
        <a
          href="/admin"
          class="text-lg font-medium text-red-500 dark:text-red-400 hover:underline transition transform hover:scale-105"
        >Admin</a>
      {/if}
    </div>

    <div class="flex items-center space-x-4">
      <button on:click={toggleTheme} aria-label="Toggle theme" class="p-2 rounded transition">
        {#if theme === 'dark'}🌙{:else}☀️{/if}
      </button>

      <div class="hidden md:flex items-center space-x-4">
        {#if data.userEmail}
          <span class="font-medium">
            {data.userEmail}{#if data.isAdmin} <span class="text-red-500">(Admin)</span>{/if}
          </span>
          <button on:click={handleSignOut} class="btn btn-primary">Sign Out</button>
        {:else}
          <a href="/auth/login" class="btn btn-primary">Log In</a>
          <a href="/auth/signup" class="btn btn-primary">Sign Up</a>
        {/if}
      </div>
    </div>
  </nav>

  {#if menuOpen}
    <div class="md:hidden p-4 space-y-4 shadow-md">
      <a
        href="/dashboard"
        class="block text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Dashboard</a>
      <a
        href="/portfolio"
        class="block text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Portfolio</a>
      <a
        href="/transactions"
        class="block text-lg font-medium hover:text-blue-600 dark:hover:text-blue-300 transition transform hover:scale-105"
      >Transactions</a>
      {#if data.isAdmin}
        <a
          href="/admin"
          class="block text-lg font-medium text-red-500 dark:text-red-400 hover:underline transition transform hover:scale-105"
        >Admin</a>
      {/if}

      <hr class="border-gray-200 dark:border-gray-700" />

      {#if data.userEmail}
        <div class="text-sm">Signed in as <strong>{data.userEmail}</strong></div>
        <button on:click={handleSignOut} class="w-full btn btn-danger">Sign Out</button>
      {:else}
        <a href="/auth/login" class="block w-full text-center btn btn-primary">Log In</a>
        <a href="/auth/signup" class="block w-full text-center btn btn-primary">Sign Up</a>
      {/if}
    </div>
  {/if}

  <!-- swap this from <main> to <div> -->
  <div class="flex-1 p-4">
    <slot />
  </div>
</div>
