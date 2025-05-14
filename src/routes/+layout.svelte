<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

  // Pull session from page data
  $: session = $page.data.session;

  // Supabase client for client-side sign-out
  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  async function signOut() {
    await supabase.auth.signOut();
    goto('/auth/logout-complete');
  }
</script>

<nav>
  {#if session}
    <a href="/dashboard">Dashboard</a>
    <a href="/portfolio">Portfolio</a>
    <a href="/transactions">Transactions</a>
    <button on:click={signOut}>Sign Out</button>
  {:else}
    <a href="/auth/login">Log In</a>
    <a href="/auth/signup">Sign Up</a>
  {/if}
</nav>

<slot />
