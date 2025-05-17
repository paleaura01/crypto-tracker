<!-- src/routes/auth/login/+page.svelte -->
<svelte:head>
  <title>Log In | CryptoTracker</title>
</svelte:head>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleLogin() {
    loading = true;
    message = '';

    // 1) Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      message = signInError.message;
      loading = false;
      return;
    }

    // 2) Grab the new session
    const {
      data: { session },
      error: getSessionError
    } = await supabase.auth.getSession();
    if (getSessionError || !session) {
      message = getSessionError?.message ?? 'Failed to retrieve session.';
      loading = false;
      return;
    }

    // 3) Set the session cookie via your endpoint
    const res = await fetch('/api/set-session-cookie', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session })
    });
    if (!res.ok) {
      const err = await res.json();
      message = err.error || 'Failed to set session cookie.';
      loading = false;
      return;
    }

    // 4) Navigate to dashboard, re-running all loads (so your layout picks up data.userEmail/data.isAdmin)
    goto('/dashboard', { replaceState: true, invalidateAll: true });
  }
</script>

<main class="max-w-md mx-auto mt-16 p-6 rounded-lg shadow-lg">
  <h1 class="text-2xl font-semibold mb-6 text-center">Welcome back</h1>

  <form on:submit|preventDefault={handleLogin} class="space-y-4">
    <input
      type="email"
      bind:value={email}
      placeholder="Email"
      autocomplete="email"
      class="w-full px-4 py-2 border rounded border-gray-300"
      required
    />

    <input
      type="password"
      bind:value={password}
      placeholder="Password"
      autocomplete="current-password"
      class="w-full px-4 py-2 border rounded border-gray-300"
      required
    />

    <button
      type="submit"
      class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded disabled:opacity-50 transition"
      disabled={loading}
    >
      {loading ? 'Logging in…' : 'Log In'}
    </button>
  </form>

  {#if message}
    <p class="mt-4 text-center text-red-500">{message}</p>
  {/if}
</main>
