<!-- src/routes/portfolio/+page.svelte -->
<script>
  let address  = '';
  let balances = [];
  let loading  = false;
  let error    = '';

  async function loadBalances() {
    if (!address) {
      error = 'Enter a wallet address';
      return;
    }
    loading = true;
    error = '';
    balances = [];

    try {
      const res = await fetch(`/api/wallet-address/quicknode?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(await res.text());
      balances = await res.json();
    } catch (e) {
      console.error(e);
      error = 'Could not load balances';
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <input
    bind:value={address}
    placeholder="0x… address"
  />
  <button on:click={loadBalances} disabled={loading}>
    {#if loading}Loading…{:else}Load Balances{/if}
  </button>

  {#if error}
    <p class="error">{error}</p>
  {:else if balances.length}
    <ul>
      {#each balances as { symbol, balance, usdValue }}
        <li>
          <strong>{symbol}</strong>: {balance.toFixed(6)}
          {#if usdValue != null}
            &nbsp;(≈${usdValue.toFixed(2)})
          {/if}
        </li>
      {/each}
    </ul>
  {:else if !loading}
    <p>No balances to display.</p>
  {/if}
</div>
