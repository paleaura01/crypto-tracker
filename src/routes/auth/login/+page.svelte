<!-- src/routes/auth/login/+page.svelte-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  export let data: { error?: string };
  let email = '', password = '';
</script>

<form method="POST" use:enhance class="max-w-sm mx-auto space-y-4">
  {#if data.error}
    <p class="text-red-400 text-center">{data.error}</p>
  {/if}

  <input name="email" type="email" placeholder="Email"
         bind:value={email}
         class="w-full p-2 rounded bg-gray-800" />

  <input name="password" type="password" placeholder="Password"
         bind:value={password}
         class="w-full p-2 rounded bg-gray-800" />

  <button type="submit"
          class="w-full py-2 bg-blue-500 rounded hover:bg-blue-400">
    Log in
  </button>
</form>
