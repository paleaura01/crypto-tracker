<script>
  let address  = '';
  let loading  = false;
  let error    = '';
  let portfolio = [];

  async function loadAll() {
    if (!address) {
      error = 'Enter a wallet address';
      return;
    }
    loading = true;
    error   = '';
    try {
      const res = await fetch(`/api/combined-portfolio?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(await res.text());
      portfolio = await res.json();
    } catch (e) {
      console.error(e);
      error = 'Could not load portfolio';
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <input bind:value={address} placeholder="0x… address" />
  <button on:click={loadAll} disabled={loading}>
    {#if loading}Loading…{:else}Load All Balances{/if}
  </button>

  {#if error}
    <p class="error">{error}</p>
  {:else if portfolio.length}
    <ul>
      {#each portfolio as { chain, symbol, balance, price, totalValue }}
        <li>
          <strong>{symbol}</strong> on {chain}: {balance}
          @ ${price} → $ {totalValue.toFixed(2)}
        </li>
      {/each}
    </ul>
  {:else if !loading}
    <p>No tokens found in Coingecko.</p>
  {/if}
</div>
