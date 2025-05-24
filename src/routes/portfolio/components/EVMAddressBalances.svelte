<script>
    import { onMount } from 'svelte';
  
    // On‐chain UI state (unchanged)
    let address    = '';
    let onchain    = [];
    let loadingChain = false;
    let errorChain   = '';
  
    // loadOnchain() stays exactly as before…
    async function loadOnchain() {
      if (!address) { errorChain = 'Enter a wallet address'; return; }
      loadingChain = true; errorChain = ''; onchain = [];
      try {
        const res = await fetch(`/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error(await res.text());
        onchain = await res.json();
        onchain.sort((a,b) => a.symbol.localeCompare(b.symbol));
      } catch (e) {
        console.error(e);
        errorChain = 'Could not load on-chain balances';
      } finally {
        loadingChain = false;
      }
    }
  </script>
  
  <style>
    .section { margin-bottom: 2rem; }
    .error { color: red; }
    input, button { margin-right: .5rem; }
  </style>
  

  
  <div class="section dark:text-white">
    <h2>On-Chain Balances</h2>
    <input bind:value={address} placeholder="0x… address" style="width:300px"/>
    <button on:click={loadOnchain} disabled={loadingChain}>
      {#if loadingChain}Loading…{:else}Load Balances{/if}
    </button>
    {#if errorChain}
      <p class="error">{errorChain}</p>
    {:else if onchain.length}
      <ul>
        {#each onchain as { symbol, balance }}
          <li><strong>{symbol}</strong>: {balance.toFixed(6)}</li>
        {/each}
      </ul>
      <h3>Raw JSON</h3>
      <pre>{JSON.stringify(onchain, null, 2)}</pre>
    {:else if !loadingChain}
      <p>No on-chain balances to display.</p>
    {/if}
  </div>
  