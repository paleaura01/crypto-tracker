<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  export let data: { error?: string };
  let email = '';
  let password = '';
</script>

<form method="POST" use:enhance class="max-w-sm mx-auto space-y-4" action="?">
  {#if data.error}
    <p class="text-red-400 text-center">{data.error}</p>
  {/if}

  <input
    name="email"
    type="email"
    autocomplete="username"
    placeholder="Email"
    bind:value={email}
    class="w-full p-2 rounded bg-gray-800"
  />

  <input
    name="password"
    type="password"
    autocomplete="current-password"
    placeholder="Password"
    bind:value={password}
    class="w-full p-2 rounded bg-gray-800"
  />

  <button
    type="submit"
    class="w-full py-2 bg-blue-500 rounded hover:bg-blue-400"
  >
    Log in
  </button>
</form>
