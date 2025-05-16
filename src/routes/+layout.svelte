<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import '../app.css';
  import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

  let userEmail: string | undefined;
  let isAdmin = false;
  let theme: 'light' | 'dark' = 'light';
  let authUnsub: { unsubscribe(): void };

  function applyTheme(t: 'light' | 'dark') {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', t);
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
  }

  export async function handleSignOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('sb-session');
      await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function checkAdmin(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId);

      isAdmin = !error && Array.isArray(data) && data.length > 0;
    } catch (err) {
      console.error('Admin check failed:', err);
      isAdmin = false;
    }
  }

  onMount(() => {
    // initialize theme
    const saved = (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
    theme = saved;
    applyTheme(saved);

    // fetch current session and then subscribe
    (async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user) {
        userEmail = session.user.email;
        await checkAdmin(session.user.id);
      }

      const { data } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, newSession: Session | null) => {
          if (newSession?.user) {
            userEmail = newSession.user.email;
            checkAdmin(newSession.user.id);
          } else {
            userEmail = undefined;
            isAdmin = false;
          }
        }
      );

      authUnsub = data.subscription;
    })();

    return () => {
      authUnsub.unsubscribe();
    };
  });
</script>

<nav class="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
  <!-- Brand on left -->
  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
    CryptoTracker
  </div>

  <!-- Centered links -->
  <div class="flex space-x-6">
    <a href="/dashboard" class="hover:text-blue-600 dark:hover:text-blue-300">Dashboard</a>
    <a href="/portfolio" class="hover:text-blue-600 dark:hover:text-blue-300">Portfolio</a>
    <a href="/transactions" class="hover:text-blue-600 dark:hover:text-blue-300">Transactions</a>
    {#if isAdmin}
      <a href="/admin" class="text-red-500 dark:text-red-400 hover:underline">Admin</a>
    {/if}
  </div>

  <!-- Theme toggle + auth on right -->
  <div class="flex items-center space-x-4">
    <button
      on:click={toggleTheme}
      aria-label="Toggle theme"
      class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      {#if theme === 'light'}🌙{:else}☀️{/if}
    </button>

    {#if userEmail}
      <span>
        {userEmail}
        {#if isAdmin}
          <span class="text-red-500">(Admin)</span>
        {/if}
      </span>
      <button
        on:click={handleSignOut}
        class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Sign Out
      </button>
    {:else}
      <a href="/auth/login" class="text-blue-600 dark:text-blue-400 hover:underline">Login</a>
      <a href="/auth/signup" class="text-blue-600 dark:text-blue-400 hover:underline">Sign Up</a>
    {/if}
  </div>
</nav>

<slot />
