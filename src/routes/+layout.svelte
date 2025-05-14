<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { createClient } from '@supabase/supabase-js';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

  // get session from +layout.server.ts
  $: session = $page.data.session;

  const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

  async function signOut() {
    await supabase.auth.signOut();
    goto('/auth/logout-complete');
  }
</script>

<header class="navbar">
  <div class="container">
    <a href="/dashboard" class="brand">CryptoTracker</a>

    <nav class="links">
      <a href="/dashboard">Dashboard</a>
      <a href="/portfolio">Portfolio</a>
      <a href="/transactions">Transactions</a>
      {#if session}
        <a href="/admin-dashboard" class="admin-link">Admin</a>
      {/if}
    </nav>

    <div class="actions">
      {#if session}
        <div class="user">Admin: {session.user.email}</div>
        <button on:click={signOut}>Sign Out</button>
      {:else}
        <a href="/auth/login" class="button">Log In</a>
      {/if}
    </div>
  </div>
</header>

<slot />

<style>
  /* Dark-mode variables */
  :root {
    --bg: #121212;
    --fg: #e0e0e0;
    --accent: #1e88e5;
    --admin-red: #e53935;
    --shadow: rgba(0, 0, 0, 0.5);
  }

  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Segoe UI', sans-serif;
  }

  .navbar {
    background: #1f1f1f;
    box-shadow: 0 2px 6px var(--shadow);
  }

  .container {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    color: var(--accent);
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
  }

  .links {
    display: flex;
    gap: 1.25rem;
  }
  .links a {
    color: var(--fg);
    text-decoration: none;
    position: relative;
    padding: 0.25rem 0;
    font-weight: 500;
    transition: color 0.2s;
  }
  .links a:hover {
    color: var(--accent);
  }

  /* Highlight admin link in red */
  .admin-link {
    color: var(--admin-red);
    font-weight: 600;
  }
  .admin-link:hover {
    color: #ff6666;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .user {
    font-size: 0.9rem;
  }

  .button,
  .actions button {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 0.3rem;
    padding: 0.4rem 0.8rem;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .button:hover,
  .actions button:hover {
    background: #1565c0;
  }

  @media (max-width: 768px) {
    .links {
      display: none;
    }
  }
</style>
