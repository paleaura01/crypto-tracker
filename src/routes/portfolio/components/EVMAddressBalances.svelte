<script lang="ts">
  // client-only
  export const ssr = false;

  import { onDestroy } from 'svelte';
  import { writable, derived, get } from 'svelte/store';
  import { startTicker, prices as cbPrices } from '$lib/stores/coinbaseTicker';

  // UI state
  let address = '';
  let loading = false;
  let error = '';
  const tokens = writable<{ symbol: string; balance: number }[]>([]);

  // Coingecko fallback
  const cgPrices = writable<Record<string,number>>({});

  // Derived lists
  const cbTokens = derived(
    [tokens, cbPrices],
    ([$tokens, $cb]) =>
      $tokens
        .filter(t => $cb[`${t.symbol}-USD`] != null)
        .map(t => ({
          symbol:  t.symbol,
          balance: t.balance,
          price:   $cb[`${t.symbol}-USD`],
          value:   t.balance * $cb[`${t.symbol}-USD`]
        }))
  );

  const cgTokens = derived(
    [tokens, cbPrices, cgPrices],
    ([$tokens, $cb, $cg]) =>
      $tokens
        .filter(t => $cb[`${t.symbol}-USD`] == null && $cg[t.symbol] != null)
        .map(t => ({
          symbol:  t.symbol,
          balance: t.balance,
          price:   $cg[t.symbol],
          value:   t.balance * $cg[t.symbol]
        }))
  );

  // Fetch on-chain balances then kick off both feeds
  async function loadOnchain() {
    if (!address) {
      error = 'Enter a wallet address';
      return;
    }
    loading = true;
    error = '';
    tokens.set([]);
    try {
      const res = await fetch(`/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error(await res.text());
      const data: { symbol: string; balance: number }[] = await res.json();
      tokens.set(data);

      // Coinbase feed (e.g. ["ETH-USD","GRT-USD",…])
      const proIds = data.map(t => `${t.symbol}-USD`);
      startTicker(proIds);

      // Coingecko fallback
      fetchCgPrices(data.map(t => t.symbol));
    } catch (e:any) {
      console.error(e);
      error = e.message || 'Failed to load on-chain balances';
    } finally {
      loading = false;
    }
  }

  async function fetchCgPrices(symbols: string[]) {
    const existing = get(cbPrices);
    const missing  = symbols
      .filter(s => existing[`${s}-USD`] == null)
      .map(s => s.toLowerCase())
      .join(',');
    if (!missing) return;

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${missing}&vs_currencies=usd`);
      if (!res.ok) throw new Error('Coingecko fetch failed');
      const data = await res.json() as Record<string,{usd:number}>;
      cgPrices.set(
        Object.fromEntries(Object.entries(data).map(([id,v]) => [id.toUpperCase(), v.usd]))
      );
    } catch (e) {
      console.error('Coingecko error', e);
    }
  }

  // no socket to tear down here—store handles it
  onDestroy(() => {});
</script>

<style>
  .scrollable { max-height:240px; overflow-y:auto; border:1px solid #ccc; padding:.5rem; border-radius:.25rem }
  .row { display:flex; justify-content:space-between; padding:.25rem 0; border-bottom:1px solid #eee }
  .row:last-child { border-bottom:none }
</style>

<div class="space-y-6">
  <!-- On-chain loader -->
  <div>
    <h2>On-Chain Balances</h2>
    <div class="flex items-center space-x-2 mt-2">
      <input
        bind:value={address}
        placeholder="0x… address"
        class="border p-2 rounded flex-1"
      />
      <button on:click={loadOnchain} class="btn btn-primary" disabled={loading}>
        {#if loading}Loading…{:else}Load Balances{/if}
      </button>
    </div>
    {#if error}<p class="text-red-500 mt-2">{error}</p>{/if}
  </div>

  <!-- Coinbase-priced tokens -->
  <div>
    <h3>Tokens with Coinbase USD Prices</h3>
    <div class="scrollable">
      {#if $cbTokens.length}
        {#each $cbTokens as t}
          <div class="row">
            <div><strong>{t.symbol}</strong> × {t.balance.toFixed(6)}</div>
            <div>${t.price.toFixed(2)} → ${(t.value).toFixed(2)}</div>
          </div>
        {/each}
      {:else if !loading}
        <p>No live Coinbase pairs.</p>
      {/if}
    </div>
  </div>

  <!-- Coingecko tokens -->
  <div>
    <h3>Tokens with Coingecko USD Prices</h3>
    <div class="scrollable">
      {#if $cgTokens.length}
        {#each $cgTokens as t}
          <div class="row">
            <div><strong>{t.symbol}</strong> × {t.balance.toFixed(6)}</div>
            <div>${t.price.toFixed(2)} → ${(t.value).toFixed(2)}</div>
          </div>
        {/each}
      {:else if !loading}
        <p>No Coingecko matches.</p>
      {/if}
    </div>
  </div>

  <!-- raw JSON -->
  <div>
    <h3>Raw JSON</h3>
    <pre class="bg-gray-100 p-2 rounded max-h-48 overflow-auto">
{JSON.stringify($tokens, null, 2)}
    </pre>
  </div>
</div>
