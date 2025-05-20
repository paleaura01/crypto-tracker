<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  // now `data.isAdmin` comes from the server load
  export let data: {
    userEmail: string;
    isAdmin: boolean;
  };

  onMount(async () => {
    console.log('Dashboard onMount: starting session check...');
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();
    console.log('getSession() result:', session, 'error:', error);
    if (!session) {
      // redirect if needed...
    } else {
      console.log('User is logged in:', session.user.email);
      console.log('Server says isAdmin =', data.isAdmin);
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
