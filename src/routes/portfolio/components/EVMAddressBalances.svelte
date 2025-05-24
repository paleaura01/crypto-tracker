<!-- src/routes/portfolio/components/EVMAddressBalances.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived, get } from 'svelte/store';

  // 1) UI state
  let address = '';
  let loading = false;
  let error = '';
  const tokens = writable<Array<{ symbol: string; balance: number }>>([]);

  // 2) Live prices store
  type PriceMap = Record<string, number>;
  const prices = writable<PriceMap>({});

  // 3) Derived list: only those tokens that have a live price
  const pricedTokens = derived(
    [tokens, prices],
    ([$tokens, $prices]) =>
      $tokens
        .filter((t) => $prices[t.symbol] != null)
        .map((t) => ({
          ...t,
          price: $prices[t.symbol],
          value: t.balance * $prices[t.symbol]
        }))
  );

  let ws: WebSocket;

  // 4) Fetch on-chain balances & open WS
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
      const data: Array<{ symbol: string; balance: number }> = await res.json();
      tokens.set(data);
      subscribePrices(data.map((t) => t.symbol));
    } catch (e: any) {
      console.error(e);
      error = e.message || 'Failed to load on-chain balances';
    } finally {
      loading = false;
    }
  }

  // 5) Subscribe to Coinbase WS for USD tickers
  function subscribePrices(symbols: string[]) {
    // If already open, close and reset
    if (ws) {
      ws.close();
      prices.set({});
    }

    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channels: [{
            name: 'ticker',
            product_ids: symbols.map((sym) => `${sym}-USD`)
          }]
        })
      );
    });

    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'ticker' && msg.product_id && msg.price) {
          const [sym] = msg.product_id.split('-');
          prices.update((p) => {
            p[sym] = parseFloat(msg.price);
            return p;
          });
        }
      } catch {
        // ignore
      }
    });

    ws.addEventListener('error', (err) => console.error('WS error', err));
    ws.addEventListener('close', () => {
      // try to reconnect after a delay
      setTimeout(() => subscribePrices(symbols), 3000);
    });
  }

  onDestroy(() => {
    if (ws) ws.close();
  });
</script>

<style>
  .scrollable {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    border-bottom: 1px solid #eee;
  }
  .row:last-child {
    border-bottom: none;
  }
</style>

<div class="space-y-4">
  <div>
    <h2 class="text-xl font-semibold">On-Chain Balances</h2>
    <div class="flex items-center space-x-2 mt-2">
      <input
        type="text"
        bind:value={address}
        placeholder="0x… address"
        class="border p-2 rounded flex-1"
      />
      <button
        on:click={loadOnchain}
        class="btn btn-primary"
        disabled={loading}
      >
        {#if loading}Loading…{:else}Load Balances{/if}
      </button>
    </div>
    {#if error}
      <p class="text-red-500 mt-2">{error}</p>
    {/if}
  </div>

  <div>
    <h3 class="font-medium">Tokens with Live USD Prices</h3>
    <div class="scrollable mt-2">
      {#if $pricedTokens.length}
        {#each $pricedTokens as t}
          <div class="row">
            <div>
              <strong>{t.symbol}</strong> × {t.balance.toFixed(6)}
            </div>
            <div>
              ${t.price.toFixed(2)} → ${(t.value).toFixed(2)}
            </div>
          </div>
        {/each}
      {:else if !loading}
        <p>No tokens with live USD pairs found.</p>
      {/if}
    </div>
  </div>

  <div>
    <h3 class="font-medium">Raw JSON</h3>
    <pre class="bg-gray-100 p-2 rounded max-h-48 overflow-auto">
{JSON.stringify($tokens, null, 2)}
    </pre>
  </div>
</div>
