<!-- src/routes/portfolio/+page.svelte -->
<script>
    import { onMount } from 'svelte';
  
    // Coinbase UI state
    let keyId     = '';
    let secret    = '';
    let passphrase= '';
    let cbBalances = [];
    let loadingCB  = false;
    let errorCB    = '';
  
    // On‐chain UI state (unchanged)
    let address    = '';
    let onchain    = [];
    let loadingChain = false;
    let errorChain   = '';
  
    // Fetch existing saved coinbase balances (if any)
    onMount(async () => {
      try {
        const res = await fetch('/data/coinbase_balances.json');
        if (res.ok) cbBalances = await res.json();
      } catch {}
    });
  
    async function loadCBBalances() {
      if (!keyId || !secret || !passphrase) {
        errorCB = 'Enter Key ID, Secret & Passphrase';
        return;
      }
      loadingCB = true;
      errorCB   = '';
      try {
        const res = await fetch('/api/coinbase/balances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyId, secret, passphrase })
        });
        if (!res.ok) throw new Error(await res.text());
        cbBalances = await res.json();
        cbBalances.sort((a,b) => a.currency.localeCompare(b.currency));
      } catch (e) {
        console.error(e);
        errorCB = 'Could not load Coinbase balances';
      } finally {
        loadingCB = false;
      }
    }
  
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
  

  
  <div class="section">
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
  