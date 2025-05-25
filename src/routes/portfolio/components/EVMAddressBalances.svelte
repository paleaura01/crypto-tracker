<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  // ──────────────────────────────────────────────────────────────
  // STORAGE KEYS
  const ADDR_KEY       = 'evmLastAddress';
  const ADDR_OVR_KEY   = 'evmAddressOverrides';
  const SYMBOL_OVR_KEY = 'evmSymbolOverrides';

  // 1) UI state
  let address = '';
  let loading = false;
  let error   = '';

  // 2) Raw on-chain data
  type RawToken = {
    symbol:           string;
    balance:          string;
    contract_address: string;
    chain:            'eth' | 'polygon' | 'bsc';
  };
  let rawOnchain: RawToken[] = [];

  // 3) CoinGecko master list
  type CoinListEntry = {
    id:        string;
    symbol:    string;
    platforms?: Record<string,string>;
  };
  let coinList: CoinListEntry[] = [];
  let rawCoinListErr: string|null = null;

  // 4) Price response
  type PriceResp = Record<string,{ usd:number }> | { error:string } | null;
  let cgResponse: PriceResp = null;

  // 5) Final portfolio
  type PortfolioItem = {
    symbol:  string;
    balance: number;
    price:   number;
    value:   number;
  };
  let portfolio: PortfolioItem[] = [];

  // 6) Address overrides (contract_address → cgId|null)
  const addressOverrideMap = writable<Record<string,string|null>>({});
  let editingAddress: string|null = null;
  let editAddressCgId = '';
  function setAddressOverride(addr: string, id: string|null) {
    addressOverrideMap.update(m => ({ ...m, [addr]: id }));
  }

  // 7) Symbol overrides (symbol → cgId|null)
  const symbolOverrideMap = writable<Record<string,string|null>>({});
  let editingSymbol: string|null = null;
  let editSymbolCgId = '';
  function setSymbolOverride(sym: string, id: string|null) {
    symbolOverrideMap.update(m => ({ ...m, [sym]: id }));
  }

  // ──────────────────────────────────────────────────────────────
  // onMount: load last address + overrides + coin list
  onMount(() => {
    // last address
    try {
      const a = localStorage.getItem(ADDR_KEY);
      if (a) {
        address = a;
        loadRaw();
      }
    } catch {}

    // address overrides
    try {
      const raw = localStorage.getItem(ADDR_OVR_KEY);
      if (raw) addressOverrideMap.set(JSON.parse(raw));
    } catch {}
    addressOverrideMap.subscribe(m =>
      localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(m))
    );

    // symbol overrides
    try {
      const raw = localStorage.getItem(SYMBOL_OVR_KEY);
      if (raw) symbolOverrideMap.set(JSON.parse(raw));
    } catch {}
    symbolOverrideMap.subscribe(m =>
      localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(m))
    );

    // coin list
    ensureCoinList();
  });

  // fetch CoinGecko master list once
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

  // ──────────────────────────────────────────────────────────────
  // STEP 1: fetch raw on-chain balances
  async function loadRaw() {
    if (!address.trim()) {
      error = 'Enter a wallet address';
      return;
    }
    // persist address
    localStorage.setItem(ADDR_KEY, address);

    loading = true;
    error   = '';
    rawOnchain = [];
    cgResponse = null;
    portfolio  = [];

    try {
      const res = await fetch(
        `/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`
      );
      if (!res.ok) throw new Error(await res.text());
      rawOnchain = await res.json();
    } catch (e:any) {
      console.error(e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // STEP 2: compute portfolio whenever rawOnchain or either override map changes
  $: if (rawOnchain.length && coinList.length) {
    // force re-run on map changes
    const _addrOv = $addressOverrideMap;
    const _symOv  = $symbolOverrideMap;
    computePortfolio();
  }

  async function computePortfolio() {
    const addrOv = get(addressOverrideMap);
    const symOv  = get(symbolOverrideMap);

    const ZERO_ADDR    = '0x0000000000000000000000000000000000000000';
    const SENT_ADDR    = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const nativeMap    = { eth:'ethereum', polygon:'matic-network', bsc:'binancecoin' };

    // Phase 1: address overrides
    const excluded = new Set<string>();
    const m1 = rawOnchain.flatMap(t => {
      const a = t.contract_address.toLowerCase();
      if (a in addrOv) {
        excluded.add(a);
        if (addrOv[a]) return [{ token:t, cgId:addrOv[a]! }];
      }
      return [];
    });

    // Phase 2: symbol overrides
    const m2 = rawOnchain.flatMap(t => {
      const a = t.contract_address.toLowerCase();
      const s = t.symbol.toUpperCase();
      if (!excluded.has(a) && s in symOv) {
        excluded.add(a);
        if (symOv[s]) return [{ token:t, cgId:symOv[s]! }];
      }
      return [];
    });

    // Phase 3: native
    const m3 = rawOnchain.flatMap(t => {
      const a = t.contract_address.toLowerCase();
      if (!excluded.has(a) && (a===ZERO_ADDR || a===SENT_ADDR)) {
        excluded.add(a);
        return [{ token:t, cgId:nativeMap[t.chain] }];
      }
      return [];
    });

    // Phase 4: platform lookup
    const m4 = rawOnchain.flatMap(t => {
      const a = t.contract_address.toLowerCase();
      if (excluded.has(a)) return [];
      for (const c of coinList) {
        if (c.platforms
         && Object.values(c.platforms).some(p => p?.toLowerCase()===a)
        ) {
          excluded.add(a);
          return [{ token:t, cgId:c.id }];
        }
      }
      return [];
    });

    // Phase 5: symbol fallback
    const m5 = rawOnchain.flatMap(t => {
      const a = t.contract_address.toLowerCase();
      if (excluded.has(a)) return [];
      const sym = t.symbol.toUpperCase();
      return coinList
        .filter(c => c.symbol.toUpperCase()===sym)
        .map(c => ({ token:t, cgId:c.id }));
    });

    // combine + dedupe by address
    const all = [...m1, ...m2, ...m3, ...m4, ...m5];
    const seen = new Set<string>();
    const uniq = all.filter(({token}) => {
      const a = token.contract_address.toLowerCase();
      if (seen.has(a)) return false;
      seen.add(a);
      return true;
    });

    // fetch prices
    if (uniq.length) {
      const ids = Array.from(new Set(uniq.map(m=>m.cgId)));
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${ids.join(',')}`
        );
        if (!res.ok) throw new Error('Price fetch failed');
        cgResponse = await res.json();
      } catch (e:any) {
        console.error(e);
        cgResponse = { error:e.message };
      }
    }

    // build portfolio
    portfolio = uniq.map(({token, cgId}) => {
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
  .scroll { max-height:200px; overflow:auto; background:#fafafa; padding:.5rem; border:1px solid #ddd; }
  .row    { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid #eee; }
  .row:last-child { border-bottom:none; }
  .error  { color:#c00; margin-top:.5rem; }
  .section{ margin-top:1.5rem; }
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
      {#each Array.from(new Set(rawOnchain.map(t=>t.symbol.toUpperCase()))) as sym}
        <div class="row">
          <span>{sym}</span>
          <span class="space-x-2">
            <button type="button" on:click={() => {
              editingSymbol = sym;
              editSymbolCgId = get(symbolOverrideMap)[sym] ?? '';
            }}>Edit</button>
            <button type="button" on:click={() => {
              setSymbolOverride(sym, null);
            }}>Remove</button>
          </span>
        </div>
        {#if editingSymbol === sym}
          <div class="mt-2">
            <select bind:value={editSymbolCgId}>
              <option value="">— choose ID —</option>
              <option value="__NONE__">⛔ Exclude</option>
              {#each coinList.filter(c=>c.symbol.toUpperCase()===sym) as c}
                <option value={c.id}>{c.id}</option>
              {/each}
            </select>
            <button type="button" on:click={() => {
              const id = editSymbolCgId==='__NONE__'?null:(editSymbolCgId||null);
              setSymbolOverride(sym, id);
              editingSymbol = null;
            }}>Save</button>
            <button type="button" on:click={() => editingSymbol = null}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Address Overrides -->
  <div class="section">
    <h3>Manage Address Overrides</h3>
    <div class="scroll">
      {#each Array.from(new Set(rawOnchain.map(t=>t.contract_address.toLowerCase()))) as addr}
        <div class="row">
          <span>
            {addr} ({rawOnchain.find(t=>t.contract_address.toLowerCase()===addr)?.symbol})
          </span>
          <span class="space-x-2">
            <button type="button" on:click={() => {
              editingAddress = addr;
              editAddressCgId = get(addressOverrideMap)[addr] ?? '';
            }}>Edit</button>
            <button type="button" on:click={() => {
              setAddressOverride(addr, null);
            }}>Remove</button>
          </span>
        </div>
        {#if editingAddress === addr}
          <div class="mt-2">
            <input
              type="text"
              bind:value={editAddressCgId}
              placeholder="CoinGecko ID (or blank to remove)"
              class="border p-1 rounded w-full"
            />
            <button type="button" on:click={() => {
              setAddressOverride(addr, editAddressCgId||null);
              editingAddress = null;
            }}>Save</button>
            <button type="button" on:click={() => editingAddress = null}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Raw JSON for debugging -->
  <div class="section">
    <h3>Raw JSON: On-Chain Balances</h3>
    <pre class="scroll">{JSON.stringify(rawOnchain, null, 2)}</pre>
  </div>
  <div class="section">
    <h3>Raw JSON: Price Response</h3>
    <pre class="scroll">{JSON.stringify(cgResponse, null, 2)}</pre>
  </div>
</div>
