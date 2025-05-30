<!-- Refactored EVMAddressBalances.svelte - Modern modular architecture -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';    // Import our new modular components
  import AddressInput from '$lib/components/shared/AddressInput.svelte';
  import OverrideManager from '$lib/components/portfolio/OverrideManager.svelte';
  import RawDataViewer from '$lib/components/debug/RawDataViewer.svelte';  import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
  
  // Import types
  import type {
    PortfolioItem,
    DebugInfo,
    DebugEvent,
    PerformanceMetrics,
    CacheStatus
  } from '$lib/components/types';
  // STORAGE KEYS
  const ADDR_KEY = 'evmLastAddress';
  const ADDR_OVR_KEY = 'evmAddressOverrides';
  const SYMBOL_OVR_KEY = 'evmSymbolOverrides';
  const BALANCE_CACHE_PREFIX = 'wallet-balances-';
  const PRICE_CACHE_PREFIX = 'price-data-';
    // CACHE EXPIRATION (in milliseconds) - for future use
  // const BALANCE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  // const PRICE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes// Core application state
  let address = '';
  let loadingBalances = false;
  let loadingPrices = false;
  let error = '';
  let coinListError: string | null = null;
  let balancesLoaded = false;
  let pricesLoaded = false;

  // Raw blockchain data
  type RawToken = { 
    symbol: string; 
    balance: string; 
    contract_address: string; 
    chain: 'eth' | 'polygon' | 'bsc';
    token_address: string;
    decimals: number;
  };
  let rawOnchain: RawToken[] = [];
  // CoinGecko data
  type CoinListEntry = { 
    id: string; 
    symbol: string;
    name: string;
    platforms?: Record<string, string> 
  };
  let coinList: CoinListEntry[] = [];

  // Price data
  type PriceResp = Record<string, { usd: number }> | { error: string } | null;
  let cgResponse: PriceResp = null;
  // Final portfolio
  let portfolio: PortfolioItem[] = [];  // UI state for compact design
  let showAllTokens = false;
  let showAdvancedCard = false; // New state for card swapping
  let showTokenHoldings = false; // New state for token holdings expansion

  // Override state management
  const addressOverrideMap = writable<Record<string, string | null>>({});
  const symbolOverrideMap = writable<Record<string, string | null>>({});
  // Debug and performance tracking
  let debugEvents: DebugEvent[] = [];
  let refreshDetector: number | null = null;
  let performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheAttempts: 0
  };  // Debug info aggregator  
  let debugInfo: DebugInfo;
  
  // Update debug info reactively
  $: {
    debugInfo = {
      refreshDetector,
      streamEvents: debugEvents,      cacheStatus: {
        healthy: !coinListError && coinList.length > 0,
        lastUpdate: coinList.length ? new Date().toISOString() : undefined,
        errors: coinListError ? [coinListError] : []
      } as CacheStatus,
      performanceMetrics
    };
  }

  // Initialize component
  onMount(async () => {
    const startTime = performance.now();
    
    // Set up debugging and monitoring
    setupDebugInfrastructure();
    
    // Restore previous state (load address + overrides)
    await restoreApplicationState();
    
    // Load initial data (coin list)
    await initializeData();
    
    // After coin list is available, apply any cached balances and prices
    await checkCachedData();
    
    // Track performance
    performanceMetrics.loadTime = Math.round(performance.now() - startTime);
    addDebugEvent('INIT_COMPLETE', `Component initialized in ${performanceMetrics.loadTime}ms`);
  });
  // Set up debug infrastructure
  function setupDebugInfrastructure() {
    refreshDetector = setupSimpleRefreshDetection();
    
    // Subscribe to override changes for localStorage backup
    addressOverrideMap.subscribe(m => {
      localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(m));
    });
    
    symbolOverrideMap.subscribe(m => {
      localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(m));
    });
  }  // Restore application state from localStorage
  async function restoreApplicationState() {
    // Restore last used address
    const savedAddress = localStorage.getItem(ADDR_KEY);
    if (savedAddress) {
      address = savedAddress;
    }

    // Load overrides
    await loadOverrides();
  }
  // Initialize core data
  async function initializeData() {
    // Only load coinlist automatically, no wallet data
    await ensureCoinList();
  }  // Check for cached data
  async function checkCachedData() {
    if (!address.trim()) return;
    
    // Load overrides first
    await loadOverrides();
    
    // Load cached balances for display (ignore TTL)
    const balanceKey = `${BALANCE_CACHE_PREFIX}${address.toLowerCase()}`;
    const rawItem = JSON.parse(localStorage.getItem(balanceKey) || 'null');
    if (rawItem?.data) {
      rawOnchain = rawItem.data;
      balancesLoaded = true;
      addDebugEvent('LOCAL_BALANCES_LOADED', `Loaded local balances for ${address}`);
    }
    
    // Load cached prices for display (ignore TTL)
    if (rawOnchain.length > 0) {
      const tokenIds = rawOnchain
        .map(token => findCoinGeckoId(token.contract_address, token.symbol))
        .filter(Boolean)
        .sort();
      if (tokenIds.length > 0) {
        const priceKey = `${PRICE_CACHE_PREFIX}${tokenIds.join(',')}`;
        const priceItem = JSON.parse(localStorage.getItem(priceKey) || 'null');
        if (priceItem?.data) {
          cgResponse = priceItem.data;
          pricesLoaded = true;
          addDebugEvent('LOCAL_PRICES_LOADED', 'Loaded local prices');
        }
      }
    }
  }
  // Get cached data with expiration check (currently unused but kept for future implementation)
  // function getCachedData(key: string, maxAge: number) {
  //   performanceMetrics.cacheAttempts++;
  //   try {
  //     const cached = localStorage.getItem(key);
  //     if (!cached) return null;
  //     
  //     const data = JSON.parse(cached);
  //     const age = Date.now() - data.timestamp;
  //     
  //     if (age > maxAge) {
  //       localStorage.removeItem(key);
  //       return null;
  //     }
  //     
  //     return data.data;
  //   } catch {
  //     localStorage.removeItem(key);
  //     return null;
  //   }
  // }

  // Store data in cache
  function setCachedData(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      addDebugEvent('CACHE_ERROR', `Failed to cache data: ${error}`);
    }
  }
  // Manual balance loading
  async function loadBalances() {
    if (!address.trim()) {
      error = 'Enter a wallet address';
      return;
    }

    localStorage.setItem(ADDR_KEY, address);
    loadingBalances = true;
    error = '';

    try {
      await ensureCoinList();

      // Load overrides first to ensure they're available when computing portfolio
      await loadOverrides();

      performanceMetrics.apiCalls++;
      const res = await fetch(`/api/wallet/balances/${address.toLowerCase()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      rawOnchain = await res.json();
      balancesLoaded = true;
      
      // Cache the balance data
      const balanceKey = `${BALANCE_CACHE_PREFIX}${address.toLowerCase()}`;
      setCachedData(balanceKey, rawOnchain);
      
      addDebugEvent('BALANCES_LOADED', `Loaded ${rawOnchain.length} tokens for ${address}`);
      
      // Clear price data and portfolio when new balances are loaded
      cgResponse = null;
      pricesLoaded = false;
      portfolio = [];
      
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
      addDebugEvent('BALANCE_ERROR', error);
    } finally {
      loadingBalances = false;
    }
  }

  // Manual price loading
  async function loadPrices() {
    if (!rawOnchain.length) {
      error = 'Load balances first';
      return;
    }

    loadingPrices = true;
    error = '';

    try {
      // Get token IDs for price lookup
      const tokenIds = rawOnchain
        .map(token => findCoinGeckoId(token.contract_address, token.symbol))
        .filter(Boolean)
        .sort();

      if (tokenIds.length === 0) {
        error = 'No valid tokens found for price lookup';
        return;
      }

      performanceMetrics.apiCalls++;
      const priceRes = await fetch(`/api/prices?ids=${tokenIds.join(',')}`);
      if (!priceRes.ok) throw new Error(`HTTP ${priceRes.status}`);
      
      cgResponse = await priceRes.json();
      pricesLoaded = true;
      
      // Cache the price data
      const priceKey = `${PRICE_CACHE_PREFIX}${tokenIds.join(',')}`;
      setCachedData(priceKey, cgResponse);
      
      addDebugEvent('PRICES_LOADED', `Loaded prices for ${tokenIds.length} tokens`);
      
      // Compute portfolio with new price data
      await computePortfolio();
      
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
      addDebugEvent('PRICE_ERROR', error);
    } finally {      loadingPrices = false;
    }
  }
  // Compute portfolio from raw data
  async function computePortfolio() {
    if (!rawOnchain.length) {
      portfolio = [];
      return;
    }
    // Build portfolio (price defaults to 0 if no response)
    portfolio = rawOnchain.map(token => {
      const balanceNum = parseFloat(token.balance);
      const id = findCoinGeckoId(token.contract_address, token.symbol) || '';
      const price = cgResponse && typeof cgResponse === 'object' && !('error' in cgResponse)
        ? cgResponse[id]?.usd || 0
        : 0;
      return {
        symbol: get(symbolOverrideMap)[token.contract_address] || token.symbol,
        balance: balanceNum,
        contractAddress: token.contract_address,
        chain: token.chain,
        coinGeckoId: id || null,
        price,
        value: balanceNum * price
      };
    });
    addDebugEvent('PORTFOLIO_COMPUTED', `Portfolio computed with ${portfolio.length} tokens`);
  }
  // Find CoinGecko ID for token
  function findCoinGeckoId(contractAddress: string, symbol: string): string | null {
    const addrOverrides = get(addressOverrideMap);
    if (Object.prototype.hasOwnProperty.call(addrOverrides, contractAddress)) {
      return addrOverrides[contractAddress] || null;
    }

    // Search by contract address in platforms
    for (const coin of coinList) {
      if (coin.platforms) {
        const addresses = Object.values(coin.platforms);
        if (addresses.some(addr => addr.toLowerCase() === contractAddress.toLowerCase())) {
          return coin.id;
        }
      }
    }

    // Fallback to symbol match
    const symbolMatch = coinList.find(coin => 
      coin.symbol.toLowerCase() === symbol.toLowerCase()
    );
    return symbolMatch?.id || null;
  }
  // Load overrides from database and localStorage fallback
  async function loadOverrides() {
    try {
      // Try to load from database first (if user is authenticated)
      const dbOverrides = await loadOverridesFromDatabase();
      
      if (dbOverrides) {
        addressOverrideMap.set(dbOverrides.addressOverrides);
        symbolOverrideMap.set(dbOverrides.symbolOverrides);
        addDebugEvent('OVERRIDES_LOADED', 'Overrides loaded from database');
        
        // Sync to localStorage as backup
        localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(dbOverrides.addressOverrides));
        localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(dbOverrides.symbolOverrides));
      } else {
        // Fallback to localStorage
        const addressOverrides = JSON.parse(localStorage.getItem(ADDR_OVR_KEY) || '{}');
        const symbolOverrides = JSON.parse(localStorage.getItem(SYMBOL_OVR_KEY) || '{}');
        
        addressOverrideMap.set(addressOverrides);
        symbolOverrideMap.set(symbolOverrides);
        addDebugEvent('OVERRIDES_LOADED', 'Overrides restored from localStorage');
      }
    } catch (error) {
      addDebugEvent('OVERRIDES_ERROR', `Failed to load overrides: ${error}`);
    }
  }

  // Load overrides from database
  async function loadOverridesFromDatabase() {
    try {
      // Get auth token from Supabase client
      const { data: { session } } = await import('$lib/supabaseClient').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        return null; // User not authenticated
      }

      const response = await fetch('/api/overrides', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to load overrides from database:', error);
      return null;
    }
  }

  // Save override to database
  async function saveOverrideToDatabase(contractAddress: string, overrideType: 'address' | 'symbol', overrideValue: string | null) {
    try {
      // Get auth token from Supabase client
      const { data: { session } } = await import('$lib/supabaseClient').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        addDebugEvent('OVERRIDE_SAVE_SKIP', 'User not authenticated, skipping database save');
        return; // User not authenticated, just use localStorage
      }

      const response = await fetch('/api/overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractAddress,
          overrideType,
          overrideValue
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      addDebugEvent('OVERRIDE_SAVED', `${overrideType} override saved for ${contractAddress}`);
    } catch (error) {
      addDebugEvent('OVERRIDE_SAVE_ERROR', `Failed to save override to database: ${error}`);
    }
  }

  // Ensure coin list is loaded
  async function ensureCoinList() {
    if (coinList.length > 0) return;

    coinListError = null;

    try {
      performanceMetrics.apiCalls++;
      const res = await fetch('/api/coinlist');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      coinList = await res.json();
      addDebugEvent('COINLIST_LOADED', `Loaded ${coinList.length} coins`);
    } catch {
      coinListError = 'Failed to load coin list';
      addDebugEvent('COINLIST_ERROR', coinListError);
    }
  }

  // Debug event tracker
  function addDebugEvent(type: string, message: string) {
    debugEvents = [
      ...debugEvents.slice(-49), // Keep last 50 events
      {
        timestamp: new Date().toISOString(),
        type,
        message
      } as DebugEvent
    ];
  }
  // Simple refresh detection
  function setupSimpleRefreshDetection(): number {
    return window.setInterval(() => {
      addDebugEvent('HEARTBEAT', 'Component still active');
    }, 30000);
  }  // Handle address input
  async function handleAddressSubmit(event: CustomEvent<{ address: string }>) {
    address = event.detail.address;
    // Reset state when address changes
    rawOnchain = [];
    cgResponse = null;
    portfolio = [];
    balancesLoaded = false;
    pricesLoaded = false;
    showTokenHoldings = false;
    error = '';
    
    // Check for cached data for the new address (this will also load overrides)
    await checkCachedData();
  }

  // Handle address save
  function handleAddressSave(event: CustomEvent<{ address: string; label?: string | undefined }>) {
    addDebugEvent('ADDRESS_SAVED', `Address saved: ${event.detail.address} ${event.detail.label ? `(${event.detail.label})` : ''}`);
  }
  // Handle override updates
  function handleAddressOverride(event: CustomEvent<{contractAddress: string, coinGeckoId: string | null}>) {
    const { contractAddress, coinGeckoId } = event.detail;
    
    // Update local state
    addressOverrideMap.update(map => ({
      ...map,
      [contractAddress]: coinGeckoId
    }));
    
    // Save to database
    saveOverrideToDatabase(contractAddress, 'address', coinGeckoId);
    
    // Recompute portfolio
    computePortfolio();
  }

  function handleSymbolOverride(event: CustomEvent<{contractAddress: string, symbol: string | null}>) {
    const { contractAddress, symbol } = event.detail;
    
    // Update local state
    symbolOverrideMap.update(map => ({
      ...map,
      [contractAddress]: symbol
    }));
    
    // Save to database
    saveOverrideToDatabase(contractAddress, 'symbol', symbol);
    
    // Recompute portfolio
    computePortfolio();
  }
  // Compute portfolio whenever rawOnchain or cgResponse change (always trigger on rawOnchain)
  $: if (rawOnchain.length > 0) {
    computePortfolio();
  }
  // Auto-expand token holdings when portfolio is loaded
  $: if (portfolio.length > 0) {
    showTokenHoldings = true;
  }
</script>

<!-- Modern Two-Card Crypto Portfolio Widget -->
<div class="w-full max-w-2xl mx-auto p-4 space-y-6">
  <!-- Header Section -->
  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
      <span class="text-4xl">💼</span>
      Crypto Portfolio Tracker
    </h1>
    {#if portfolio.length > 0}
      <div class="text-2xl font-bold text-green-600">
        ${portfolio.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div class="text-sm text-gray-500">{portfolio.length} tokens across {[...new Set(portfolio.map(t => t.chain))].length} chains</div>
    {/if}  </div>  <!-- Single Connected Card Layout -->
  <div class="max-w-2xl mx-auto">
    
    <!-- Main Card: Portfolio Management & Token Holdings -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      
      <!-- Top Section: Wallet Address Controls -->
      <div class="p-6 space-y-6 relative border-b border-gray-100">
        
        {#if !showAdvancedCard}
          <!-- Wallet Address Card -->
          <!-- Settings Cog Button -->
          <button 
            class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            on:click={() => showAdvancedCard = true}
            title="Advanced Settings"
          >
            <span class="text-xl">⚙️</span>
          </button>

          <!-- Status Indicators -->
          <div class="flex flex-wrap gap-2 justify-center lg:justify-start pr-12">
            {#if balancesLoaded}
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
                <span>✓</span>
                Balances Loaded
              </span>
            {/if}
            {#if pricesLoaded}
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                <span>💰</span>
                Prices Loaded
              </span>
            {/if}
            {#if error}
              <span class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
                <span>⚠</span>
                Error
              </span>
            {/if}
          </div>

          <!-- Address Input Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>🔍</span>
                Wallet Address
              </h3>
              
              <!-- Action Buttons -->
              {#if address.trim()}
                <div class="flex gap-2">
                  <button 
                    class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    class:animate-pulse={loadingBalances}
                    disabled={loadingBalances || loadingPrices}
                    on:click={loadBalances}
                    title={balancesLoaded ? 'Refresh Balances' : 'Load Balances'}
                  >
                    <span class="text-sm">🔄</span>
                    {balancesLoaded ? 'Refresh' : 'Load'}
                  </button>

                  {#if balancesLoaded && rawOnchain.length > 0}
                    <button 
                      class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      class:animate-pulse={loadingPrices}
                      disabled={loadingBalances || loadingPrices}
                      on:click={loadPrices}
                      title={pricesLoaded ? 'Refresh Prices' : 'Load Prices'}
                    >
                      <span class="text-sm">💲</span>
                      Prices
                    </button>
                  {/if}
                </div>
              {/if}
            </div>

            <AddressInput 
              bind:address
              loading={loadingBalances || loadingPrices}
              {error}
              on:submit={handleAddressSubmit}
              on:save={handleAddressSave}
            />
          </div>

          <!-- Welcome/Empty States -->
          {#if !address.trim()}
            <div class="text-center py-8 space-y-4">
              <div class="text-6xl">🚀</div>
              <div class="text-lg font-medium text-gray-600">Enter a wallet address to get started</div>
              <div class="text-sm text-gray-500">Track your crypto portfolio across Ethereum, Polygon, and BSC</div>
            </div>
          {:else if balancesLoaded && rawOnchain.length === 0}
            <div class="text-center py-8 space-y-4">
              <div class="text-6xl">📭</div>
              <div class="text-lg font-medium text-gray-600">No tokens found</div>
              <div class="text-sm text-gray-500">This address doesn't have any tokens on the supported chains</div>
            </div>
          {/if}

        {:else}
          <!-- Advanced Features Card -->
          <!-- Back Button -->
          <button 
            class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            on:click={() => showAdvancedCard = false}
            title="Back to Wallet"
          >
            <span class="text-xl">←</span>
          </button>

          <div class="space-y-6 pr-12">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>⚙️</span>
              Advanced Features
            </h3>

            <div class="space-y-4">
              <OverrideManager
                availableTokens={rawOnchain.map(token => ({ symbol: get(symbolOverrideMap)[token.contract_address] || token.symbol, contractAddress: token.contract_address || '', chain: token.chain || 'eth' }))}
                coinList={coinList.map(coin => ({ ...coin, name: coin.name || coin.symbol }))}
                addressOverrides={$addressOverrideMap}
                symbolOverrides={$symbolOverrideMap}
                on:addressOverride={handleAddressOverride}
                on:symbolOverride={handleSymbolOverride}
              />

              <DebugPanel {debugInfo} />
              
              <RawDataViewer 
                rawOnchain={rawOnchain.map(token => ({
                  ...token,
                  token_address: token.contract_address,
                  decimals: token.decimals || 18
                }))}
                priceResponse={cgResponse && typeof cgResponse === 'object' && !('error' in cgResponse) ? cgResponse : null}
                coinList={coinList.map(coin => ({ ...coin, name: coin.name || coin.symbol }))}
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Expandable Token Holdings Section -->
      {#if portfolio.length > 0 && !showAdvancedCard}
        <!-- Toggle Button -->
        <button 
          class="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200 border-b border-gray-100"
          on:click={() => showTokenHoldings = !showTokenHoldings}
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">🪙</span>
            <span class="text-lg font-semibold text-gray-900">Token Holdings</span>
            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {portfolio.length}
            </span>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-xl font-bold text-green-600">
                ${portfolio.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div class="text-xs text-gray-500">{[...new Set(portfolio.map(t => t.chain))].length} chains</div>
            </div>
            <span class="text-2xl transform transition-transform duration-200" class:rotate-180={showTokenHoldings}>
              ⌄
            </span>
          </div>
        </button>

        <!-- Expandable Token List -->
        <div class="overflow-hidden transition-all duration-300 ease-in-out" 
             class:max-h-0={!showTokenHoldings} 
             class:max-h-[600px]={showTokenHoldings}>
          <div class="p-6">
            <div class="space-y-3 max-h-96 overflow-y-auto">
              {#each (pricesLoaded ? portfolio.filter(token => token.price > 0) : portfolio).sort((a, b) => b.value - a.value).slice(0, showAllTokens ? undefined : 8) as token}
                <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200" 
                     class:bg-gradient-to-r={token.value > 1000}
                     class:from-green-50={token.value > 1000}
                     class:to-green-100={token.value > 1000}
                     class:border-green-200={token.value > 1000}>
                  
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-lg font-bold text-gray-900">{token.symbol}</span>
                      <span class="px-2 py-1 rounded-md text-xs font-bold text-white"
                            class:bg-blue-500={token.chain === 'eth'}
                            class:bg-purple-500={token.chain === 'polygon'}
                            class:bg-yellow-500={token.chain === 'bsc'}>
                        {(token.chain || 'unknown').toUpperCase()}
                      </span>
                    </div>
                    <div class="text-sm text-gray-600 font-medium">
                      {token.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })} tokens
                    </div>
                  </div>
                  
                  <div class="text-right">
                    {#if token.price > 0}
                      <div class="text-lg font-bold text-green-600">
                        ${token.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div class="text-xs text-gray-500">
                        ${token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} each
                      </div>
                    {:else}
                      <div class="text-lg font-bold text-gray-400">--</div>
                      <div class="text-xs text-gray-400">No price data</div>
                    {/if}
                  </div>
                </div>
              {/each}
              
              {#if portfolio.length > 8}
                <div class="text-center pt-2">
                  <button 
                    class="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors duration-200"
                    on:click={() => showAllTokens = !showAllTokens}
                  >
                    {showAllTokens ? 'Show Less' : `View ${portfolio.length - 8} More Tokens`}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}    </div>
  </div>
</div>

<style>
  /* Minimal custom styles - most styling handled by Tailwind */
  /* Smooth scroll for token list */
  .max-h-96 {
    max-height: 400px;
    scrollbar-width: thin;
    scrollbar-color: rgb(203 213 225) transparent;
  }
  
  .max-h-96::-webkit-scrollbar {
    width: 6px;
  }
  
  .max-h-96::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .max-h-96::-webkit-scrollbar-thumb {
    background-color: rgb(203 213 225);
    border-radius: 3px;
  }
  
  .max-h-96::-webkit-scrollbar-thumb:hover {
    background-color: rgb(148 163 184);
  }

  /* Smooth transitions for expandable sections */
  .max-h-0 {
    max-height: 0;
  }
  
  .max-h-\[600px\] {
    max-height: 600px;
  }

  /* Rotate animation for chevron */
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>
