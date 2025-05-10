<script>
  import { onMount } from 'svelte';

  let balances = null;

  function connect() {
    window.open(
      '/api/cb/oauth2/auth',
      'cb-oauth',
      'width=500,height=600'
    );
  }

  function onMessage(e) {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'coinbase-oauth-success') {
      balances = e.data.balances;
    }
  }

  onMount(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  });
</script>

<button on:click={connect}>
  Connect with Coinbase
</button>

{#if balances}
  <pre>{JSON.stringify(balances, null, 2)}</pre>
{:else}
  <p>Not connected</p>
{/if}
