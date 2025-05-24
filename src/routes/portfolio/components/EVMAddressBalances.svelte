<!-- src/routes/portfolio/components/EVMAddressBalances.svelte -->
<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  // 1) UI state
  let address    = '';
  let loading    = false;
  let error      = '';

  // 2) Raw on-chain data
  type RawToken = {
    symbol:           string;
    balance:          string;   // string from Moralis
    contract_address: string;
    chain:            'eth'|'polygon'|'bsc';
  };
  let rawOnchain: RawToken[] = [];

  // 3) CoinGecko master list
  type CoinListEntry = {
    id:        string;
    symbol:    string;
    platforms?: Record<string,string>;
  };
  let coinList: CoinListEntry[] = [];
  let rawCoinListErr: string | null = null;

  // 4) Price responses
  type PriceResp = Record<string,{ usd:number }> | { error:string } | null;
  let cgResponse:      PriceResp = null;  // by address
  let cgSymbolResp:    PriceResp = null;  // by symbol

  // 5) Final portfolios
  type PortfolioItem = {
    symbol:  string;
    balance: number;
    price:   number;
    value:   number;
  };
  let portfolio:       PortfolioItem[] = [];
  let symbolPortfolio: PortfolioItem[] = [];

  // 6) Overrides store (symbol → cgId or null)
  const OVERRIDE_KEY = 'evmFallbackOverrides';
  const overrideMap = writable<Record<string,string|null>>({});
  let editingSymbol: string | null = null;
  let editCgId      = '';
  function setOverride(sym: string, id: string|null) {
    overrideMap.update(m => ({ ...m, [sym]: id }));
  }
  onMount(() => {
    // load overrides
    try {
      const stored = localStorage.getItem(OVERRIDE_KEY);
      if (stored) overrideMap.set(JSON.parse(stored));
    } catch {}
    overrideMap.subscribe(m => {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(m));
    });
  });

  // load the full CoinGecko list once
  async function ensureCoinList() {
    if (coinList.length || rawCoinListErr) return;
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/list?include_platform=true'
      );
      if (!res.ok) throw new Error('Failed to load CoinGecko list');
      coinList = await res.json();
    } catch (e:any) {
      rawCoinListErr = e.message;
      console.error(e);
    }
  }
  onMount(ensureCoinList);

  // main loader
  async function loadOnchain() {
    if (!address.trim()) { error = 'Enter a wallet address'; return; }
    loading = true;
    error   = '';
    rawOnchain = [];
    portfolio = [];
    symbolPortfolio = [];
    cgResponse = null;
    cgSymbolResp = null;

    await ensureCoinList();
    const overrides = get(overrideMap);

    try {
      // 1) fetch on-chain
      const res = await fetch(
        `/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`
      );
      if (!res.ok) throw new Error(await res.text());
      rawOnchain = await res.json();

      // sets to track processed tokens
      const processedContracts = new Set<string>();
      const matchedByAddress: { token:RawToken; cgId:string }[] = [];

      // 2) apply manual overrides first
      for (const t of rawOnchain) {
        const sym = t.symbol.toUpperCase();
        if (sym in overrides) {
          const id = overrides[sym];
          if (id) {
            matchedByAddress.push({ token: t, cgId: id });
          }
          processedContracts.add(t.contract_address.toLowerCase());
        }
      }

      // 3) address-based matching
      const nativeMap: Record<string,string> = {
        eth: 'ethereum',
        polygon: 'matic-network',
        bsc: 'binancecoin'
      };
      for (const t of rawOnchain) {
        const addr = t.contract_address.toLowerCase();
        if (processedContracts.has(addr)) continue;
        // native sentinel
        if (addr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          const id = nativeMap[t.chain];
          if (id) {
            matchedByAddress.push({ token: t, cgId: id });
            processedContracts.add(addr);
          }
          continue;
        }
        // full platforms scan
        for (const coin of coinList) {
          if (!coin.platforms) continue;
          if (Object.values(coin.platforms)
            .some(a => a?.toLowerCase() === addr)
          ) {
            matchedByAddress.push({ token: t, cgId: coin.id });
            processedContracts.add(addr);
            break;
          }
        }
      }

      // dedupe by token.contract_address
      const seenAddr = new Set<string>();
      const uniqAddrMatches = matchedByAddress.filter(m => {
        const a = m.token.contract_address.toLowerCase();
        if (seenAddr.has(a)) return false;
        seenAddr.add(a);
        return true;
      });

      // 4) fetch address-based prices
      if (uniqAddrMatches.length) {
        const ids     = Array.from(new Set(uniqAddrMatches.map(m=>m.cgId)));
        const pRes    = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${ids.join(',')}`
        );
        if (!pRes.ok) throw new Error('Address-price fetch failed');
        cgResponse = await pRes.json();
        portfolio = uniqAddrMatches.map(({token,cgId}) => {
          const bal = Number(token.balance);
          const p   = (cgResponse as any)[cgId]?.usd || 0;
          return { symbol: token.symbol.toUpperCase(), balance: bal, price: p, value: bal*p };
        });
      } else {
        cgResponse = { error: 'No address-matched tokens' };
      }

      // 5) symbol-based fallback
      const unmatched = rawOnchain.filter(t =>
        !processedContracts.has(t.contract_address.toLowerCase())
      );
      const symbolMatches: { token:RawToken; cgId:string }[] = [];
      for (const t of unmatched) {
        const sym = t.symbol.toUpperCase();
        if (sym in overrides && overrides[sym] === null) continue; // user excluded
        for (const coin of coinList) {
          if (coin.symbol.toUpperCase() === sym) {
            symbolMatches.push({ token: t, cgId: coin.id });
          }
        }
      }
      // dedupe by symbol
      const seenSym = new Set<string>();
      const uniqSymMatches = symbolMatches.filter(m => {
        const s = m.token.symbol.toUpperCase();
        if (seenSym.has(s)) return false;
        seenSym.add(s);
        return true;
      });

      if (uniqSymMatches.length) {
        const ids2 = Array.from(new Set(uniqSymMatches.map(m=>m.cgId)));
        const sRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${ids2.join(',')}`
        );
        if (!sRes.ok) throw new Error('Symbol-price fetch failed');
        cgSymbolResp = await sRes.json();
        symbolPortfolio = uniqSymMatches.map(({token,cgId}) => {
          const bal = Number(token.balance);
          const p   = (cgSymbolResp as any)[cgId]?.usd || 0;
          return { symbol: token.symbol.toUpperCase(), balance: bal, price: p, value: bal*p };
        });
      } else {
        cgSymbolResp = { error: 'No symbol-matched tokens' };
      }

    } catch (e:any) {
      console.error(e);
      error            = e.message;
      cgResponse       ||= { error: e.message };
      cgSymbolResp     ||= { error: e.message };
    } finally {
      loading = false;
    }
  }
</script>

<style>
  .scroll {
    max-height: 200px;
    overflow: auto;
    background: #fafafa;
    padding: .5rem;
    border: 1px solid #ddd;
    border-radius: .25rem;
    font-size: .85rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: .5rem 0;
    border-bottom: 1px solid #eee;
  }
  .row:last-child { border-bottom: none; }
  .error { color: #c00; margin-top: .5rem; }
</style>

<div class="space-y-6">
  <div>
    <input
      bind:value={address}
      placeholder="0x… address"
      class="border p-2 rounded w-full"
    />
    <button
      on:click={loadOnchain}
      class="btn btn-primary mt-2"
      disabled={loading}
    >
      {#if loading}Loading…{:else}Load Balances{/if}
    </button>
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  {#if portfolio.length}
    <div>
      <h3>Address-Matched Portfolio</h3>
      {#each portfolio as item}
        <div class="row">
          <div><strong>{item.symbol}</strong> × {item.balance.toFixed(6)}</div>
          <div>${item.price.toFixed(4)} → {item.value.toFixed(4)}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if symbolPortfolio.length}
    <div>
      <h3>Symbol-Matched Fallback</h3>
      {#each symbolPortfolio as item}
        <div class="row">
          <div><strong>{item.symbol}</strong> × {item.balance.toFixed(6)}</div>
          <div>${item.price.toFixed(4)} → {item.value.toFixed(4)}</div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Manage Overrides -->
  <div>
    <h3>Manage Symbol Overrides</h3>
    <div class="scroll">
      {#each Array.from(new Set(rawOnchain.map(t=>t.symbol.toUpperCase()))) as sym}
        <div class="row">
          <span>{sym}</span>
          <span class="space-x-2">
            <button on:click={() => {
              editingSymbol = sym;
              editCgId      = get(overrideMap)[sym] || '';
            }}>Edit</button>
            <button on:click={() => {
              setOverride(sym,null);
              loadOnchain();
            }}>Remove</button>
          </span>
        </div>
        {#if editingSymbol === sym}
          <div class="mt-2">
            <select bind:value={editCgId}>
              <option value="">— choose ID —</option>
              {#each coinList.filter(c=>c.symbol.toUpperCase()===sym) as c}
                <option value={c.id}>{c.id}</option>
              {/each}
            </select>
            <button on:click={() => {
              setOverride(sym, editCgId || null);
              editingSymbol = null;
              loadOnchain();
            }}>Save</button>
            <button on:click={() => editingSymbol = null}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <div>
    <h3>Raw JSON: On-Chain Balances</h3>
    <pre class="scroll">{JSON.stringify(rawOnchain, null, 2)}</pre>
  </div>
  <div>
    <h3>Raw JSON: Price Response (by address)</h3>
    <pre class="scroll">{JSON.stringify(cgResponse, null, 2)}</pre>
  </div>
  <div>
    <h3>Raw JSON: Price Response (by symbol)</h3>
    <pre class="scroll">{JSON.stringify(cgSymbolResp, null, 2)}</pre>
  </div>
  <div>
    <h3>Raw JSON: CoinGecko Coins List</h3>
    {#if rawCoinListErr}
      <p class="error">{rawCoinListErr}</p>
    {:else}
      <pre class="scroll">{JSON.stringify(coinList, null, 2)}</pre>
    {/if}
  </div>
</div>
