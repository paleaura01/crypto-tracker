<!-- no need to re-import app.css here, it comes from your root +layout.svelte -->
<svelte:head>
  <title>Log In | Crypto Tracker</title>
</svelte:head>

<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let mounted = false;
  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  onMount(() => {
    // ensure we only render after hydration (avoids flicker)
    mounted = true;
  });

  async function handleLogin() {
    loading = true;
    message = '';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('No session returned');

      const res = await fetch('/api/set-session-cookie', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: data.session })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to set session cookie');
      }

      goto('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      message = err.message;
    } finally {
      loading = false;
    }
  }
</script>

{#if mounted}
<main>
  <form
    on:submit|preventDefault={handleLogin}
    class="max-w-md mx-auto mt-12 p-8 rounded-lg shadow-lg"
  >
    <h2 class="text-2xl font-semibold mb-6">
      Welcome back
    </h2>

    <div class="space-y-4 mb-6">
      <input
        type="email"
        bind:value={email}
        placeholder="Email"
        autocomplete="email"
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2"
        required
      />
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        autocomplete="current-password"
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2"
        required
      />
    </div>

    <button
      type="submit"
      class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded disabled:opacity-50 transition"
      disabled={loading}
    >
      {#if loading}Logging in…{:else}Log In{/if}
    </button>

    {#if message}
      <p class="mt-4 text-center text-red-500">{message}</p>
    {/if}
  </form>
</main>
{/if}
