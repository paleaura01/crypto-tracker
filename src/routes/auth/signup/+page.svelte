<script lang="ts">
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  async function signUp() {
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) {
      error = err.message;
    } else {
      goto('/auth/verify');
    }
  }
</script>

<h1>Sign Up</h1>
<form on:submit|preventDefault={signUp}>
  <input type="email" bind:value={email} placeholder="Email" required />
  <input type="password" bind:value={password} placeholder="Password" required />
  {#if error}<p style="color:red">{error}</p>{/if}
  <button type="submit">Sign Up</button>
</form>
