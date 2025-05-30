<!-- Refactored EVMAddressBalances.svelte - Modern modular architecture -->
<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';    // Import our new modular components
  import AddressInput from '$lib/components/shared/AddressInput.svelte';
  import OverrideManager from '$lib/components/portfolio/OverrideManager.svelte';
  import RawDataViewer from '$lib/components/debug/RawDataViewer.svelte';
  import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
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
  let portfolio: PortfolioItem[] = [];

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
  }
  // Handle address input
  async function handleAddressSubmit(event: CustomEvent<{ address: string }>) {
    address = event.detail.address;
    // Reset state when address changes
    rawOnchain = [];
    cgResponse = null;
    portfolio = [];
    balancesLoaded = false;
    pricesLoaded = false;
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
</script>

<div class="evm-address-balances">
  <AddressInput 
    bind:address
    loading={loadingBalances || loadingPrices}
    {error}
    on:submit={handleAddressSubmit}
    on:save={handleAddressSave}
  />

  <!-- Manual Control Buttons -->
  {#if address.trim()}
    <div class="control-buttons">
      <button 
        class="btn btn-primary"
        class:loading={loadingBalances}
        disabled={loadingBalances || loadingPrices}
        on:click={loadBalances}
      >
        {#if loadingBalances}
          Loading...
        {:else if balancesLoaded}
          Refresh Balances
        {:else}
          Load Balances
        {/if}
      </button>

      {#if balancesLoaded && rawOnchain.length > 0}
        <button 
          class="btn btn-secondary"
          class:loading={loadingPrices}
          disabled={loadingBalances || loadingPrices}
          on:click={loadPrices}
        >
          {#if loadingPrices}
            Loading...
          {:else if pricesLoaded}
            Refresh Prices
          {:else}
            Load Prices
          {/if}
        </button>
      {/if}

      <!-- Cache Status Indicators -->
      <div class="cache-status">
        {#if balancesLoaded}
          <span class="status-indicator status-success">✓ Balances</span>
        {/if}
        {#if pricesLoaded}
          <span class="status-indicator status-success">✓ Prices</span>
        {/if}
      </div>
    </div>
  {/if}  {#if portfolio.length > 0}
    <div class="portfolio-section">
      <div class="portfolio-header">
        <div class="header-left">
          <h3>
            {#if pricesLoaded}
              Tradable Assets ({portfolio.filter(token => token.price > 0).length} tokens)
            {:else}
              All Assets ({portfolio.length} tokens)
            {/if}
          </h3>
          <span class="total-tokens">of {portfolio.length} total tokens</span>
        </div>
        <div class="total-value">
          Total Value: <span class="value-amount">${portfolio.reduce((sum, item) => sum + item.value, 0).toFixed(2)}</span>
        </div>
      </div>
        <div class="portfolio-table">
        <div class="table-header">
          <div>Token</div>
          <div>Balance</div>
          <div>Price</div>
          <div>Value</div>
          <div>Chain</div>
        </div>
        <div class="table-body">
          {#each (pricesLoaded ? portfolio.filter(token => token.price > 0) : portfolio).sort((a, b) => b.value - a.value) as token}
            <div class="table-row">
              <div class="col-token">
                <div class="token-info">
                  <span class="token-symbol">{token.symbol}</span>
                  {#if token.contractAddress}
                    <span class="contract-address" title={token.contractAddress}>
                      {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                    </span>
                  {/if}
                </div>
              </div>
              <div class="col-balance">
                <span class="balance-amount">{token.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
              </div>
              <div class="col-price">
                <span class="price-amount">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
              </div>
              <div class="col-value">
                <span class="value-amount">${token.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="col-chain">
                <span class="chain-badge chain-{token.chain}">{token.chain?.toUpperCase() || 'ETH'}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if balancesLoaded && rawOnchain.length === 0}
    <div class="no-tokens">
      <p>No tokens found for this address.</p>
    </div>
  {/if}

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

<style>
  .evm-address-balances {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .control-buttons {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 1.5rem 0;
    padding: 1rem;
    background: var(--surface, #f8f9fa);
    border-radius: 8px;
    border: 1px solid var(--border, #e1e4e8);
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary, #0066cc);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #0052a3);
  }

  .btn-secondary {
    background: var(--secondary, #6c757d);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--secondary-hover, #545b62);
  }

  .btn.loading {
    position: relative;
    color: transparent;
  }

  .btn.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .cache-status {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }

  .status-indicator {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  .status-success {
    background: var(--success-bg, #d4edda);
    color: var(--success-text, #155724);
    border: 1px solid var(--success-border, #c3e6cb);
  }
  .portfolio-section {
    margin: 2rem 0;
    background: white;
    border-radius: 16px;
    border: 1px solid var(--border, #e1e4e8);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .portfolio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2.5rem;
    background: linear-gradient(135deg, var(--surface, #f8f9fa) 0%, #ffffff 100%);
    border-bottom: 1px solid var(--border, #e1e4e8);
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .portfolio-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #1a1a1a);
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .total-tokens {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
    font-weight: 500;
  }
  .total-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }

  .value-amount {
    color: var(--text-primary, #1a1a1a);
    font-weight: 700;
  }

  .portfolio-table {
    display: flex;
    flex-direction: column;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr;
    gap: 1rem;
    padding: 1.25rem 2.5rem;
    background: var(--surface-secondary, #f8fafc);
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--text-secondary, #475569);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 2px solid var(--border-light, #f1f5f9);
  }
  .table-body {
    max-height: 400px;
    overflow-y: auto;
  }
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr 1fr;
    gap: 1rem;
    padding: 1.5rem 2.5rem;
    border-bottom: 1px solid var(--border-light, #f1f5f9);
    transition: all 0.2s ease;
  }

  .table-row:hover {
    background: var(--surface-hover, #f8fafc);
  }

  .col-token {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .token-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .token-symbol {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--text-primary, #1a1a1a);
  }

  .contract-address {
    font-size: 0.75rem;
    color: var(--text-muted, #9ca3af);
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
    background: var(--surface, #f3f4f6);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    width: fit-content;
  }

  .col-balance,
  .col-price,
  .col-value {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 1rem;
  }

  .balance-amount {
    color: var(--text-primary, #1a1a1a);
  }

  .price-amount {
    color: var(--text-primary, #1a1a1a);
  }

  .value-amount {
    color: var(--success-text, #059669);
    font-weight: 700;
  }

  .col-chain {
    display: flex;
    align-items: center;
  }

  .chain-badge {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .chain-eth {
    background: linear-gradient(135deg, #627eea, #4f46e5);
    color: white;
  }

  .chain-polygon {
    background: linear-gradient(135deg, #8247e5, #7c3aed);
    color: white;
  }

  .chain-bsc {
    background: linear-gradient(135deg, #f3ba2f, #eab308);
    color: white;
  }
  
  .no-tokens {
    text-align: center;
    padding: 2rem;
    color: var(--muted, #6c757d);
  }
</style>
