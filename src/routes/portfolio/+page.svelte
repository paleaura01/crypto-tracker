<script>
  let address   = '';
  let chain     = 'ethereum';    // keep “ethereum” in the dropdown
  let balances  = [];
  let loading   = false;
  let error     = '';

  async function loadBalances() {
    if (!address) {
      error = 'Enter a wallet address';
      return;
    }
    loading = true;
    error = '';
    balances = [];

    try {
      const res = await fetch(
        `/api/wallet-address/moralis?address=${encodeURIComponent(address)}&chain=${chain}`
      );
      if (!res.ok) throw new Error(await res.text());
      balances = await res.json();
      console.log('✅ got balances:', balances);
    } catch (e) {
      console.error(e);
      error = 'Could not load balances';
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <input bind:value={address} placeholder="0x… address" />

  <select bind:value={chain}>
    <option value="ethereum">Ethereum</option>
    <option value="polygon">Polygon</option>
    <option value="bsc">BSC</option>
    <!-- add other EVM chains as you like -->
  </select>

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
