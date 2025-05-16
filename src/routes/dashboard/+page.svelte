<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { Session } from '@supabase/supabase-js';

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

<template>
  <h1>Welcome, {data.userEmail}!</h1>
  {#if data.isAdmin}
    <p>You have admin access.</p>
  {:else}
    <p>You are a regular user.</p>
  {/if}
</template>
