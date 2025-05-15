<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  $: session = $page.data.session;
</script>

{#if session}
  <p>Welcome, {session.user.email}</p>
{:else}
  <a href="/auth/login">Log in</a>
{/if}
