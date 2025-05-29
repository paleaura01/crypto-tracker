<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  // now `data.isAdmin` comes from the server load
  export let data: {
    userEmail: string;
    isAdmin: boolean;
  };

  onMount(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      // redirect if needed...
    } else {
      // User is logged in - admin status available in data.isAdmin
    }
  });
</script>

<template >
  <h1 class="dark:text-white">Welcome, {data.userEmail}!</h1>
  {#if data.isAdmin}
    <p class="dark:text-white">You have admin access.</p>
  {:else}
    <p class="dark:text-white">You are a regular user.</p>
  {/if}
</template>
