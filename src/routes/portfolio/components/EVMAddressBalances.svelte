<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  // ──────────────────────────────────────────────────────────────
  // STORAGE KEYS
  const ADDR_KEY       = 'evmLastAddress';
  const ADDR_OVR_KEY   = 'evmAddressOverrides';
  const SYMBOL_OVR_KEY = 'evmSymbolOverrides';

  // UI state
  let address = '';
  let loading = false;
  let error   = '';

  // Raw on‐chain data
  type RawToken = {
    symbol:           string;
    balance:          string;
    contract_address: string;
    chain:            'eth'|'polygon'|'bsc';
  };
  let rawOnchain: RawToken[] = [];

  // CoinGecko master list
  type CoinListEntry = {
    id:        string;
    symbol:    string;
    platforms?: Record<string,string>;
  };
  let coinList: CoinListEntry[] = [];
  let rawCoinListErr: string|null = null;

  // Price response
  type PriceResp = Record<string,{ usd:number }> | { error:string } | null;
  let cgResponse: PriceResp = null;

  // Final portfolio
  type PortfolioItem = {
    symbol:  string;
    balance: number;
    price:   number;
    value:   number;
  };
  let portfolio: PortfolioItem[] = [];

  // Overrides
  const addressOverrideMap = writable<Record<string,string|null>>({});
  const symbolOverrideMap  = writable<Record<string,string|null>>({});

  // Editing UI
  let editingSymbol: string|null = null;
  let editSymbolCgId = '';

  let editingAddress: string|null = null;
  let editAddressCgId = '';

  // onMount: restore from localStorage + initial load
  onMount(() => {
    const a = localStorage.getItem(ADDR_KEY);
    if (a) address = a;

    try {
      const ra = localStorage.getItem(ADDR_OVR_KEY);
      if (ra) addressOverrideMap.set(JSON.parse(ra));
      const rs = localStorage.getItem(SYMBOL_OVR_KEY);
      if (rs) symbolOverrideMap.set(JSON.parse(rs));
    } catch {}

    addressOverrideMap.subscribe(m =>
      localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(m))
    );
    symbolOverrideMap.subscribe(m =>
      localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(m))
    );

    // kick off initial load & compute
    loadRaw();
    ensureCoinList();

    // whenever overrides change, recompute in-place
    addressOverrideMap.subscribe(() => {
      if (!loading && rawOnchain.length) computePortfolio();
    });
    symbolOverrideMap.subscribe(() => {
      if (!loading && rawOnchain.length) computePortfolio();
    });
  });

  // fetch CoinGecko master list once
  async function ensureCoinList() {
    if (coinList.length || rawCoinListErr) return;
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/list?include_platform=true'
      );
      if (!res.ok) throw new Error();
      coinList = await res.json();
    } catch {
      rawCoinListErr = 'Failed to load CoinGecko list';
    }
  }

  // STEP 1: load on-chain balances + compute
  async function loadRaw() {
    if (!address.trim()) { error = 'Enter a wallet address'; return; }
    localStorage.setItem(ADDR_KEY, address);
    loading    = true;
    error      = '';
    rawOnchain = [];
    cgResponse = null;
    portfolio  = [];

    try {
      await ensureCoinList();

      const res = await fetch(
        `/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`
      );
      if (!res.ok) throw new Error(await res.text());
      rawOnchain = await res.json();
      await computePortfolio();
    } catch (e:any) {
      console.error(e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // STEP 2: apply overrides → native → platform → symbol, then fetch prices
  async function computePortfolio() {
    await ensureCoinList();
    if (!rawOnchain.length) return;

    const addrOv = get(addressOverrideMap);
    const symOv  = get(symbolOverrideMap);
    const ZERO   = '0x0000000000000000000000000000000000000000';
    const SENT   = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const native = { eth:'ethereum', polygon:'matic-network', bsc:'binancecoin' };

    const picks: { token:RawToken; cgId:string }[] = [];
    const seen = new Set<string>();

    for (const t of rawOnchain) {
      const a = t.contract_address.toLowerCase();
      if (seen.has(a)) continue;

      // 1) address override
      if (a in addrOv) {
        seen.add(a);
        if (addrOv[a]) picks.push({ token:t, cgId:addrOv[a]! });
        continue;
      }

      const s = t.symbol.toUpperCase();

      // 2) symbol override
      if (s in symOv) {
        seen.add(a);
        if (symOv[s]) picks.push({ token:t, cgId:symOv[s]! });
        continue;
      }

      // 3) native token placeholder
      if (a === ZERO || a === SENT) {
        seen.add(a);
        picks.push({ token:t, cgId:native[t.chain] });
        continue;
      }

      // 4) platform scan
      const plat = coinList.find(c =>
        c.platforms &&
        Object.values(c.platforms).some(p => p?.toLowerCase() === a)
      );
      if (plat) {
        seen.add(a);
        picks.push({ token:t, cgId:plat.id });
        continue;
      }

      // 5) symbol fallback
      const sym = coinList.find(c => c.symbol.toUpperCase() === s);
      if (sym) {
        seen.add(a);
        picks.push({ token:t, cgId:sym.id });
      }
    }

    console.log('picks:', picks);

    // fetch USD prices
    const ids = Array.from(new Set(picks.map(x => x.cgId)));
    if (ids.length) {
      try {
        const resp = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${ids.join(',')}`
        );
        if (!resp.ok) throw new Error();
        cgResponse = await resp.json();
      } catch {
        cgResponse = { error:'Price fetch failed' };
      }
    }

    // build the array for UI
    portfolio = picks.map(({ token, cgId }) => {
      const bal = Number(token.balance);
      const p   = (cgResponse as any)[cgId]?.usd || 0;
      return {
        symbol: token.symbol.toUpperCase(),
        balance: bal,
        price: p,
        value: bal * p
      };
    });
  }
</script>

<style>
  .scroll  { max-height:200px; overflow:auto; background:#fafafa; padding:.5rem; border:1px solid #ddd; }
  .row     { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid #eee; }
  .row:last-child { border-bottom:none; }
  .error   { color:#c00; margin-top:.5rem; }
  .section { margin-top:1.5rem; }
</style>

<div class="space-y-6">
  <!-- Address Input -->
  <div>
    <input
      bind:value={address}
      placeholder="0x… address"
      class="border p-2 rounded w-full"
    />
    <button type="button" on:click={loadRaw} class="btn btn-primary mt-2" disabled={loading}>
      {#if loading}Loading…{:else}Load Balances{/if}
    </button>
    {#if error}<p class="error">{error}</p>{/if}
  </div>

  <!-- Matched Portfolio -->
  {#if portfolio.length}
    <div class="section">
      <h3>Matched Portfolio</h3>
      {#each portfolio as item}
        <div class="row">
          <div><strong>{item.symbol}</strong> × {item.balance.toFixed(6)}</div>
          <div>${item.price.toFixed(4)} → {item.value.toFixed(4)}</div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Symbol Overrides -->
  <div class="section">
    <h3>Manage Symbol Overrides</h3>
    <div class="scroll">
      {#each Array.from(new Set(rawOnchain.map(t => t.symbol.toUpperCase()))) as sym}
        <div class="row">
          <span>{sym}</span>
          <span class="space-x-2">
            <button
              type="button"
              on:click={() => {
                editingSymbol = sym;
                editSymbolCgId = get(symbolOverrideMap)[sym] || '';
              }}
            >Edit</button>
            <button
              type="button"
              on:click={() => symbolOverrideMap.update(m => ({ ...m, [sym]: null }))}
            >Remove</button>
          </span>
        </div>
        {#if editingSymbol === sym}
          <div class="mt-2">
            <select bind:value={editSymbolCgId}>
              <option value="">— choose ID —</option>
              <option value="__NONE__">⛔ Exclude</option>
              {#each coinList.filter(c => c.symbol.toUpperCase() === sym) as c}
                <option value={c.id}>{c.id}</option>
              {/each}
            </select>
            <button
              type="button"
              on:click={() => {
                const id = editSymbolCgId === '__NONE__' ? null : (editSymbolCgId || null);
                symbolOverrideMap.update(m => ({ ...m, [sym]: id }));
                editingSymbol = null;
              }}
            >Save</button>
            <button type="button" on:click={() => (editingSymbol = null)}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Address Overrides -->
  <div class="section">
    <h3>Manage Address Overrides</h3>
    <div class="scroll">
      {#each Array.from(new Set(rawOnchain.map(t => t.contract_address.toLowerCase()))) as addr}
        <div class="row">
          <span>
            {addr} ({rawOnchain.find(t => t.contract_address.toLowerCase() === addr)?.symbol})
          </span>
          <span class="space-x-2">
            <button
              type="button"
              on:click={() => {
                editingAddress = addr;
                editAddressCgId = get(addressOverrideMap)[addr] || '';
              }}
            >Edit</button>
            <button
              type="button"
              on:click={() => addressOverrideMap.update(m => ({ ...m, [addr]: null }))}
            >Remove</button>
          </span>
        </div>
        {#if editingAddress === addr}
          <div class="mt-2">
            <input
              bind:value={editAddressCgId}
              placeholder="CoinGecko ID (or blank to remove)"
              class="border p-1 rounded w-full"
            />
            <button
              type="button"
              on:click={() => {
                addressOverrideMap.update(m => ({ ...m, [addr]: editAddressCgId || null }));
                editingAddress = null;
              }}
            >Save</button>
            <button type="button" on:click={() => (editingAddress = null)}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Raw JSON: On-Chain Balances -->
  <div class="section">
    <h3>Raw JSON: On-Chain Balances</h3>
    <pre class="scroll">{JSON.stringify(rawOnchain, null, 2)}</pre>
  </div>

  <!-- Raw JSON: Price Response -->
  <div class="section">
    <h3>Raw JSON: Price Response</h3>
    <pre class="scroll">{JSON.stringify(cgResponse, null, 2)}</pre>
  </div>

  <!-- Raw JSON: CoinGecko List -->
  <div class="section">
    <h3>Raw JSON: CoinGecko List</h3>
    {#if rawCoinListErr}
      <p class="error">{rawCoinListErr}</p>
    {:else}
      <pre class="scroll">{JSON.stringify(coinList, null, 2)}</pre>
    {/if}
  </div>
</div>
