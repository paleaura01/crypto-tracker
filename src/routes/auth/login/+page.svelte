<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleLogin() {
    loading = true;
    message = '';

    // 1) sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      message = signInError.message;
      loading = false;
      return;
    }

    // 2) get the fresh session
    const {
      data: { session },
      error: getSessionError
    } = await supabase.auth.getSession();
    if (getSessionError || !session) {
      message = getSessionError?.message || 'Could not retrieve session.';
      loading = false;
      return;
    }

    // 3) set the HTTP-only cookie
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

    // 4) redirect & invalidate so +layout.server.ts runs again
    goto('/dashboard', { replaceState: true, invalidateAll: true });
  }
</script>

<main class="max-w-md mx-auto mt-16 p-6  rounded shadow-lg">
  <h1 class="text-2xl font-semibold mb-6 text-center ">
    Welcome Back
  </h1>

  <form on:submit|preventDefault={handleLogin} class="space-y-4">
    <input
      type="email"
      bind:value={email}
      placeholder="Email"
      required
      class="w-full px-4 py-2 border rounded  dark:border-gray-600 "
    />

    <input
      type="password"
      bind:value={password}
      placeholder="Password"
      required
      class="w-full px-4 py-2 border rounded dark:border-gray-600 "
    />

    <button
      type="submit"
      class="w-full py-2 btn btn-primary"
      disabled={loading}
    >
      {loading ? 'Logging in…' : 'Log In'}
    </button>

    
  </form>

 
  <p class="mt-4 text-center text-sm ">
    Don’t have an account?
    <a href="/auth/signup" class="text-blue-600 hover:underline">
      Click here to sign up!
    </a>
  </p>

  {#if message}
    <p class="mt-4 text-center text-red-500">{message}</p>
  {/if}
</main>
