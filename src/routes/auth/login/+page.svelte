<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  // hydration guard
  let hydrated = false;
  onMount(() => {
    hydrated = true;
  });

  async function handleLogin() {
    loading = true;
    message = '';

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      message = signInError.message;
      loading = false;
      return;
    }

    const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
    if (getSessionError || !session) {
      message = getSessionError?.message || 'Could not retrieve session.';
      loading = false;
      return;
    }

    const res = await fetch('/api/set-session-cookie', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session })
    });
    if (!res.ok) {
      const errJson = await res.json();
      message = errJson.error || 'Failed to set session cookie.';
      loading = false;
      return;
    }

    goto('/dashboard', { replaceState: true, invalidateAll: true });
  }
</script>

{#if hydrated}
  <div
    class="
           max-w-md mx-auto mt-16 p-6
         bg-gray-50 text-gray-800 dark:bg-gray-700
           rounded shadow-lg"
  >
    <h1 class="text-2xl font-semibold mb-6 text-center dark:text-gray-100">Welcome Back</h1>

    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <input
        type="email"
        bind:value={email}
        autocomplete="username"
        placeholder="Email"
        required
        class="w-full px-4 py-2 border rounded border-gray-400 dark:text-gray-100"
      />

      <input
        type="password"
        bind:value={password}
        autocomplete="current-password"
        placeholder="Password"
        required
        class="w-full px-4 py-2 border rounded border-gray-400
               bg-white dark:bg-gray-700
               text-gray-900 dark:text-gray-100"
      />

      <button type="submit" class="w-full py-2 btn btn-primary" disabled={loading}>
        {loading ? 'Logging in…' : 'Log In'}
      </button>
    </form>

    <p class="mt-4 text-center text-sm">
      Don’t have an account?
      <a href="/auth/signup" class="text-blue-600 hover:underline dark:text-blue-400">
        Click here to sign up!
      </a>
    </p>

    {#if message}
      <p class="mt-4 text-center text-red-500">{message}</p>
    {/if}
  </div>
{/if}
