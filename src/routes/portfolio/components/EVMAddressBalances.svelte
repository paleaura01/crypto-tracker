<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';

  // STORAGE KEYS
  const ADDR_KEY       = 'evmLastAddress';
  const ADDR_OVR_KEY   = 'evmAddressOverrides';
  const SYMBOL_OVR_KEY = 'evmSymbolOverrides';

  // UI state
  let address = '';
  let loading    = false;
  let error      = '';

  // Raw on‐chain data
  type RawToken = { symbol:string; balance:string; contract_address:string; chain:'eth'|'polygon'|'bsc' };
  let rawOnchain: RawToken[] = [];

  // CoinGecko master list
  type CoinListEntry = { id:string; symbol:string; platforms?:Record<string,string> };
  let coinList: CoinListEntry[] = [];
  let rawCoinListErr: string|null = null;

  // Price response
  type PriceResp = Record<string,{ usd:number }> | { error:string } | null;
  let cgResponse: PriceResp = null;

  // Final portfolio
  type PortfolioItem = { symbol:string; balance:number; price:number; value:number };
  let portfolio: PortfolioItem[] = [];

  // Overrides stores
  const addressOverrideMap = writable<Record<string,string|null>>({});
  const symbolOverrideMap  = writable<Record<string,string|null>>({});

  // For the “edit” UI
  let editingSymbol: string|null = null;
  let editSymbolCgId = '';

  let editingAddress: string|null = null;
  let editAddressCgId = '';

  onMount(async () => {
    // restore last address
    const a = localStorage.getItem(ADDR_KEY);
    if (a) address = a;

    // Auto-load test wallet address if no address set
    if (!address) {
      try {
        const testDataRes = await fetch('/src/data/test-wallet-data.json');
        if (testDataRes.ok) {
          const testData = await testDataRes.json();
          if (testData.testWalletAddress) {
            address = testData.testWalletAddress;
            console.log('🔄 Auto-loaded test wallet address:', address);
          }
        }
      } catch (e) {
        console.log('No test data found, continuing with manual input');
      }
    }

    // restore overrides
    try {
      const ra = localStorage.getItem(ADDR_OVR_KEY);
      if (ra) addressOverrideMap.set(JSON.parse(ra));
      const rs = localStorage.getItem(SYMBOL_OVR_KEY);
      if (rs) symbolOverrideMap.set(JSON.parse(rs));
    } catch {}

    // persist overrides with logging
    addressOverrideMap.subscribe(m => {
      console.log('📝 Address overrides updated:', m);
      localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(m));
    });
    symbolOverrideMap.subscribe(m => {
      console.log('📝 Symbol overrides updated:', m);
      localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(m));
    });

    loadRaw();
    ensureCoinList();
  });

  // fetch CoinGecko list once
  async function ensureCoinList() {
    if (coinList.length || rawCoinListErr) return;
    try {
      // Try to load from cache first
      const cacheRes = await fetch('/src/data/coingecko-list.json');
      if (cacheRes.ok) {
        coinList = await cacheRes.json();
        console.log('📋 Loaded cached CoinGecko list:', coinList.length, 'coins');
        return;
      }
    } catch (e) {
      console.log('📋 No cached CoinGecko list found');
    }
    
    // Fallback to API if no cache
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

  // Refresh CoinGecko list and save to cache
  async function refreshCoinList() {
    loading = true;
    rawCoinListErr = null;
    try {
      console.log('🔄 Refreshing CoinGecko list...');
      const res = await fetch(
        'https://api.coingecko.com/api/v3/coins/list?include_platform=true'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newList = await res.json();
      
      // Save to cache
      await fetch('/api/save-coingecko-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      });
      
      coinList = newList;
      console.log('✅ CoinGecko list refreshed and cached:', coinList.length, 'coins');
    } catch (e: any) {
      console.error('❌ Failed to refresh CoinGecko list:', e);
      rawCoinListErr = `Failed to refresh: ${e.message}`;
    } finally {
      loading = false;
    }
  }

  // STEP 1: fetch + compute
  async function loadRaw() {
    if (!address.trim()) {
      error = 'Enter a wallet address';
      return;
    }
    localStorage.setItem(ADDR_KEY, address);
    loading    = true;
    error      = '';
    rawOnchain = [];
    cgResponse = null;
    portfolio  = [];

    try {
      await ensureCoinList();

      // Try to load from cache first
      const cacheFile = `/src/data/wallet-balances-${address.toLowerCase()}.json`;
      try {
        const cacheRes = await fetch(cacheFile);
        if (cacheRes.ok) {
          rawOnchain = await cacheRes.json();
          console.log('📋 Loaded cached wallet balances:', rawOnchain.length, 'tokens');
          await computePortfolio();
          return;
        }
      } catch (e) {
        console.log('📋 No cached wallet balances found for', address);
      }

      // Fallback to API if no cache
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

  // Refresh balances from API and cache
  async function refreshBalances() {
    if (!address.trim()) {
      error = 'Enter a wallet address';
      return;
    }
    loading = true;
    error = '';
    
    try {
      console.log('🔄 Refreshing wallet balances from API...');
      const res = await fetch(
        `/api/wallet-address/combined-portfolio?address=${encodeURIComponent(address)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const newBalances = await res.json();
      
      // Save to cache
      await fetch('/api/save-wallet-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase(), balances: newBalances })
      });
      
      rawOnchain = newBalances;
      console.log('✅ Wallet balances refreshed and cached:', rawOnchain.length, 'tokens');
      await computePortfolio();
    } catch (e: any) {
      console.error('❌ Failed to refresh wallet balances:', e);
      error = `Failed to refresh: ${e.message}`;
    } finally {
      loading = false;
    }
  }

  // STEP 2: build portfolio from rawOnchain + overrides
  async function computePortfolio() {
    await ensureCoinList();
    if (!rawOnchain.length) {
      console.log('❌ No raw on-chain data to process');
      return;
    }

    console.log('🚀 Starting portfolio computation...');
    console.log('📊 Raw on-chain tokens:', rawOnchain.length);
    
    const addrOv = get(addressOverrideMap);
    const symOv  = get(symbolOverrideMap);
    console.log('🔧 Address overrides:', addrOv);
    console.log('🔧 Symbol overrides:', symOv);
    
    const ZERO   = '0x0000000000000000000000000000000000000000';
    const SENT   = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const native = { eth:'ethereum', polygon:'matic-network', bsc:'binancecoin' };

    const picks: { token:RawToken; cgId:string }[] = [];
    const seen = new Set<string>();

    for (const t of rawOnchain) {
      const a = t.contract_address.toLowerCase();
      const s = t.symbol.toUpperCase();
      const chainKey = `${a}-${t.chain}`; // Use address+chain as unique key
      
      console.log(`\n🔍 Processing token: ${s} on ${t.chain}`);
      console.log(`   Address: ${a}`);
      console.log(`   Balance: ${t.balance}`);
      console.log(`   Chain key: ${chainKey}`);
      
      // Special BNB debugging
      if (s === 'BNB') {
        console.log(`🟡 BNB DETECTED - Special debugging:`);
        console.log(`   Chain: ${t.chain}`);
        console.log(`   Address: ${a}`);
        console.log(`   ZERO constant: ${ZERO}`);
        console.log(`   SENT constant: ${SENT}`);
        console.log(`   Address === ZERO: ${a === ZERO}`);
        console.log(`   Address === SENT: ${a === SENT}`);
        console.log(`   Symbol in overrides: ${s in symOv}`);
        console.log(`   Symbol override value: ${symOv[s]}`);
      }
      
      if (seen.has(chainKey)) {
        console.log(`   ⏭️ Skipping duplicate address+chain: ${chainKey}`);
        continue;
      }

      // 1) address override
      if (a in addrOv) {
        console.log(`   🎯 Found address override: ${addrOv[a]}`);
        seen.add(chainKey);
        if (addrOv[a]) {
          picks.push({ token:t, cgId:addrOv[a]! });
          console.log(`   ✅ Added via address override`);
        } else {
          console.log(`   🚫 Excluded via address override`);
        }
        continue;
      }

      // 2) symbol override
      if (s in symOv) {
        console.log(`   🎯 Found symbol override: ${symOv[s]}`);
        seen.add(chainKey);
        if (symOv[s]) {
          picks.push({ token:t, cgId:symOv[s]! });
          console.log(`   ✅ Added via symbol override`);
        } else {
          console.log(`   🚫 Excluded via symbol override`);
        }
        continue;
      }

      // 3) native sentinel
      if (a === ZERO || a === SENT) {
        console.log(`   🏛️ Native token detected for ${t.chain} -> ${native[t.chain]}`);
        seen.add(chainKey);
        picks.push({ token:t, cgId:native[t.chain] });
        console.log(`   ✅ Added as native token`);
        continue;
      }

      // 4) platform lookup
      const plat = coinList.find(c =>
        c.platforms
        && Object.values(c.platforms).some(p=>p?.toLowerCase()===a)
      );
      if (plat) {
        console.log(`   🌐 Found platform match: ${plat.id}`);
        seen.add(chainKey);
        picks.push({ token:t, cgId:plat.id });
        console.log(`   ✅ Added via platform lookup`);
        continue;
      }

      // 5) symbol fallback
      const sym = coinList.find(c => c.symbol.toUpperCase() === s);
      if (sym) {
        console.log(`   🔤 Found symbol fallback: ${sym.id}`);
        seen.add(chainKey);
        picks.push({ token:t, cgId:sym.id });
        console.log(`   ✅ Added via symbol fallback`);
      } else {
        console.log(`   ❌ No match found for ${s}`);
      }
    }

    console.log('\n📋 Final picks:', picks);
    console.log('📊 Tokens matched:', picks.length);

    // fetch prices
    const ids = Array.from(new Set(picks.map(p=>p.cgId)));
    console.log('🏷️ CoinGecko IDs to fetch:', ids);
    
    if (ids.length) {
      try {
        const priceUrl = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${ids.join(',')}`;
        console.log('💰 Fetching prices from:', priceUrl);
        
        const resp = await fetch(priceUrl);
        if (!resp.ok) throw new Error();
        cgResponse = await resp.json();
        console.log('💰 Price response:', cgResponse);
      } catch (e) {
        console.error('❌ Price fetch failed:', e);
        cgResponse = { error: 'Price fetch failed' };
      }
    }

    // final portfolio
    portfolio = picks.map(({ token, cgId }) => {
      const bal = +token.balance;
      const p   = (cgResponse as any)[cgId]?.usd || 0;
      const item = {
        symbol: token.symbol.toUpperCase(),
        balance: bal,
        price: p,
        value: bal * p
      };
      console.log(`💼 Portfolio item: ${item.symbol} = ${item.balance} × $${item.price} = $${item.value}`);
      return item;
    });
    
    console.log('🎯 Final portfolio:', portfolio);
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
      <h3>Matched Portfolio
        <button type="button" on:click={computePortfolio} class="bg-green-500 text-white px-3 py-1 rounded text-sm ml-2">
          🔄 Refresh Prices
        </button>
      </h3>
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
              editSymbolCgId = get(symbolOverrideMap)[sym] || '';
            }}>Edit</button>
            <button type="button" on:click={() => {
              symbolOverrideMap.update(m => ({ ...m, [sym]: null }));
              loadRaw();
            }}>Remove</button>
          </span>
        </div>
        {#if editingSymbol===sym}
          <div class="mt-2 space-y-2">
            <select bind:value={editSymbolCgId} class="border p-1 rounded w-full">
              <option value="">— choose ID —</option>
              <option value="__NONE__">⛔ Exclude</option>
              {#each coinList.filter(c=>c.symbol.toUpperCase()===sym) as c}
                <option value={c.id}>{c.id}</option>
              {/each}
            </select>
            <input
              bind:value={editSymbolCgId}
              placeholder="Or type CoinGecko ID manually (e.g. binancecoin)"
              class="border p-1 rounded w-full text-sm"
            />
            <div class="flex space-x-2">
              <button type="button" on:click={() => {
                const id = editSymbolCgId==='__NONE__'?null:editSymbolCgId||null;
                symbolOverrideMap.update(m => ({ ...m, [sym]: id }));
                editingSymbol = null;
                loadRaw();
              }} class="bg-blue-500 text-white px-3 py-1 rounded text-sm">Save</button>
              <button type="button" on:click={() => editingSymbol=null} class="bg-gray-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Address Overrides -->
  <div class="section">
    <h3>Manage Address Overrides</h3>
    <div class="scroll">
      {#each Array.from(new Set(rawOnchain.map(t=>`${t.contract_address.toLowerCase()}-${t.chain}`))) as chainKey}
        {@const [addr, chain] = chainKey.split('-')}
        {@const token = rawOnchain.find(t=>t.contract_address.toLowerCase()===addr && t.chain===chain)}
        <div class="row">
          <span>{addr} ({token?.symbol} on {chain})</span>
          <span class="space-x-2">
            <button type="button" on:click={() => {
              editingAddress = addr;
              editAddressCgId = get(addressOverrideMap)[addr] || '';
            }}>Edit</button>
            <button type="button" on:click={() => {
              addressOverrideMap.update(m => ({ ...m, [addr]: null }));
              loadRaw();
            }}>Remove</button>
          </span>
        </div>
        {#if editingAddress===addr}
          <div class="mt-2">
            <input
              bind:value={editAddressCgId}
              placeholder="CoinGecko ID (or blank to remove)"
              class="border p-1 rounded w-full"
            />
            <button type="button" on:click={() => {
              addressOverrideMap.update(m => ({ ...m, [addr]: editAddressCgId||null }));
              editingAddress = null;
              loadRaw();
            }}>Save</button>
            <button type="button" on:click={() => editingAddress=null}>Cancel</button>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Raw JSON (unchanged) -->
  <div class="section">
    <h3>Raw JSON: On-Chain Balances
      <button type="button" on:click={refreshBalances} class="bg-blue-500 text-white px-3 py-1 rounded text-sm ml-2" disabled={loading}>
        🔄 Refresh Balances
      </button>
    </h3>
    <pre class="scroll">{JSON.stringify(rawOnchain,null,2)}</pre>
  </div>
  <div class="section">
    <h3>Raw JSON: Price Response</h3>
    <pre class="scroll">{JSON.stringify(cgResponse,null,2)}</pre>
  </div>

  <!-- CoinGecko List JSON -->
  <div class="section">
    <h3>Raw JSON: CoinGecko List
      <button type="button" on:click={refreshCoinList} class="bg-blue-500 text-white px-3 py-1 rounded text-sm ml-2" disabled={loading}>
        🔄 Refresh Coin List
      </button>
    </h3>
    {#if rawCoinListErr}
      <p class="error">{rawCoinListErr}</p>
    {/if}
    <pre class="scroll">{JSON.stringify(coinList, null, 2)}</pre>
  </div>
</div>
