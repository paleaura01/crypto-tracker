<script lang="ts">
  import '../app.css';               // ← Imports your Tailwind-generated CSS
  import type { Session } from '@supabase/supabase-js';

  // These come from +layout.server.ts (below)
  export let data: {
    session: Session | null;
    isAdmin: boolean;
  };
</script>

<div class="dark min-h-screen bg-gray-900 text-gray-100 flex flex-col">
  <header class="py-4 px-6 border-b border-gray-700">
    <div class="grid grid-cols-3 items-center">

      <!-- Title -->
      <div>
        <a href="/" class="text-2xl font-bold text-blue-500 hover:text-blue-400">
          CryptoTracker
        </a>
      </div>

      <!-- Center Nav -->
      <nav class="flex justify-center space-x-4">
        {#if data.session}
          <a href="/dashboard"    class="px-3 py-1 rounded hover:bg-gray-800 transition">Dashboard</a>
          <a href="/portfolio"    class="px-3 py-1 rounded hover:bg-gray-800 transition">Portfolio</a>
          <a href="/transactions" class="px-3 py-1 rounded hover:bg-gray-800 transition">Transactions</a>
          {#if data.isAdmin}
            <a href="/admin" class="px-3 py-1 rounded bg-red-600 hover:bg-red-500 transition text-white">Admin</a>
          {/if}
        {/if}
      </nav>

      <!-- Right: User / Auth -->
      <div class="flex justify-end items-center space-x-4">
        {#if data.session}
          <span class="text-sm truncate max-w-xs flex items-center">
            {#if data.isAdmin}
              <span class="italic text-yellow-300 mr-1">(admin)</span>
            {/if}
            {data.session.user.email}
          </span>
          <form method="POST" action="/auth/logout">
            <button
              type="submit"
              class="px-3 py-1 rounded hover:bg-gray-800 transition text-sm"
            >
              Logout
            </button>
          </form>
        {:else}
          <a
            href="/auth/login"
            class="px-3 py-1 rounded hover:bg-gray-800 transition text-sm"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            class="px-3 py-1 rounded hover:bg-gray-800 transition text-sm"
          >
            Sign Up
          </a>
        {/if}
      </div>

    </div>
  </header>

  <main class="flex-1 p-6">
    <slot />
  </main>
</div>
