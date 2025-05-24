<!-- src/routes/portfolio/components/EVMAddressBalances.svelte -->
<script lang="ts">
  interface OnchainToken { symbol: string; balance: number; }

  let address       = '';
  let onchain: OnchainToken[] = [];
  let loadingChain  = false;
  let errorChain    = '';

  async function loadOnchain() {
    if (!address) {
      errorChain = 'Enter a wallet address';
      return;
    }
    loadingChain = true;
    errorChain   = '';
    onchain      = [];

    console.log('[UI] loadOnchain() →', address);

    try {
      const res = await fetch(
        `/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`
      );
      console.log('[UI] fetch status', res.status);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = (await res.json()) as OnchainToken[];
      console.log('[UI] received', data.length, 'tokens');
      onchain = data;
    } catch (err) {
      console.error('[UI] loadOnchain error', err);
      errorChain = `Could not load on-chain balances (${err.message})`;
    } finally {
      loadingChain = false;
    }
  }
</script>

<style>
  .section { margin-bottom: 2rem; }
  .error   { color: red; }
  input, button { margin-right: .5rem; }
</style>

<div class="section dark:text-white">
  <h2>On-Chain Balances</h2>
  <input
    bind:value={address}
    placeholder="0x… wallet address"
    style="width:300px"
  />
  <button on:click={loadOnchain} disabled={loadingChain}>
    {#if loadingChain}Loading…{:else}Load Balances{/if}
  </button>

  {#if errorChain}
    <p class="error">{errorChain}</p>
  {:else if onchain.length}
    <ul>
      {#each onchain as { symbol, balance }}
        <li><strong>{symbol}</strong>: {balance}</li>
      {/each}
    </ul>
    <h3>Raw JSON</h3>
    <pre>{JSON.stringify(onchain, null, 2)}</pre>
  {:else if !loadingChain}
    <p>No on-chain balances to display.</p>
  {/if}
</div>
