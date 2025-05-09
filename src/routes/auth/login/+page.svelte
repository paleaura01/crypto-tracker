<svelte:head>
  <title>Welcome | Crypto Tracker</title>
</svelte:head>

<script>
  import { supabase } from '$lib/supabase';
  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  async function handleLogin() {
    try {
      loading = true;
      message = 'Logging in...';

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!data.session) {
        throw new Error('Login succeeded, but no session was returned.');
      }

      // Set session cookie on the server with credentials so that the cookie is stored
      const res = await fetch('/api/set-session-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session: data.session })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to set session cookie');
      }

      message = 'Logged in successfully!';
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      message = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<h1>Login</h1>
<form name="login" on:submit|preventDefault={handleLogin}>
  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    name="email"
    autocomplete="email"
    required
    style="display: block; margin-bottom: 1rem;"
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    name="password"
    autocomplete="current-password"
    required
    style="display: block; margin-bottom: 1rem;"
  />
  <button type="submit" disabled={loading}>
    {#if loading}Loading...{:else}Login{/if}
  </button>
</form>
<p>{message}</p>
