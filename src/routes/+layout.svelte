<script lang="ts">
  import '../app.css';
  import type { Session } from '@supabase/supabase-js';
  export let data: { session: Session | null; isAdmin: boolean };
</script>

<nav class="bg-gray-50 p-4 flex gap-6 font-medium">
  {#if data.session}
    <a href="/dashboard"    class="hover:underline">Dashboard</a>
    <a href="/portfolio"    class="hover:underline">Portfolio</a>
    <a href="/transactions" class="hover:underline">Transactions</a>
    {#if data.isAdmin}
      <a href="/admin" class="hover:underline text-red-600">Admin</a>
    {/if}
    <form method="POST" action="/auth/logout" class="ml-auto">
      <button type="submit" class="hover:underline">Logout</button>
    </form>
  {:else}
    <a href="/auth/login"  class="hover:underline">Login</a>
    <a href="/auth/signup" class="hover:underline">Sign Up</a>
  {/if}
</nav>

<slot />
