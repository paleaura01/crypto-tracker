<!-- Refactored EVMAddressBalances.svelte - Modern modular architecture -->
<script lang="ts">
  export const ssr = false;
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';
    // Import our new modular components
  import AddressInput from '$lib/components/shared/AddressInput.svelte';
  import PortfolioDisplay from '$lib/components/portfolio/PortfolioDisplay.svelte';
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

  // Core application state
  let address = '';
  let loading = false;
  let error = '';
  let coinListError: string | null = null;

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
    
    // Restore previous state
    await restoreApplicationState();
    
    // Load initial data
    await initializeData();
      // Track performance
    performanceMetrics.loadTime = Math.round(performance.now() - startTime);
    addDebugEvent('INIT_COMPLETE', `Component initialized in ${performanceMetrics.loadTime}ms`);
  });

  // Set up debug infrastructure
  function setupDebugInfrastructure() {
    refreshDetector = setupSimpleRefreshDetection();
    
    // Subscribe to override changes for debugging
    addressOverrideMap.subscribe(m => {
      localStorage.setItem(ADDR_OVR_KEY, JSON.stringify(m));
    });
    
    symbolOverrideMap.subscribe(m => {
      localStorage.setItem(SYMBOL_OVR_KEY, JSON.stringify(m));
    });
  }

  // Restore application state from localStorage
  async function restoreApplicationState() {
    // Restore last used address
    const savedAddress = localStorage.getItem(ADDR_KEY);
    if (savedAddress) {
      address = savedAddress;
    }

    // Auto-load test wallet if no address set
    if (!address) {
      try {
        performanceMetrics.apiCalls++;
        const testDataRes = await fetch('/data/test-wallet-data.json');
        if (testDataRes.ok) {
          const testData = await testDataRes.json();
          if (testData.testWalletAddress) {
            address = testData.testWalletAddress;
            addDebugEvent('AUTO_LOAD', `Test wallet address loaded: ${address}`);
          }        }
      } catch {
        addDebugEvent('AUTO_LOAD_FAILED', 'No test data found');
      }
    }

    // Load overrides
    await loadOverrides();
  }

  // Initialize core data
  async function initializeData() {
    if (address) {
      await Promise.all([
        ensureCoinList(),
        loadWalletData()
      ]);
    } else {
      await ensureCoinList();
    }
  }

  // Load wallet balance data
  async function loadWalletData() {
    if (!address.trim()) {
      error = 'Enter a wallet address';
      return;
    }

    localStorage.setItem(ADDR_KEY, address);
    loading = true;
    error = '';
    rawOnchain = [];
    cgResponse = null;
    portfolio = [];

    try {
      await ensureCoinList();

      // Try cache first
      performanceMetrics.cacheAttempts++;
      const cacheFile = `/data/wallet-balances-${address.toLowerCase()}.json`;
      
      try {
        performanceMetrics.apiCalls++;
        const cacheRes = await fetch(cacheFile);
        if (cacheRes.ok) {
          const cachedData = await cacheRes.json();
          rawOnchain = cachedData;
          performanceMetrics.cacheHits++;
          addDebugEvent('CACHE_HIT', `Loaded cached balances for ${address}`);
        } else {        throw new Error('Cache miss');
        }
      } catch {
        // Fetch fresh data
        performanceMetrics.apiCalls++;
        const res = await fetch(`/api/wallet/${address}/balances`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rawOnchain = await res.json();
        addDebugEvent('FRESH_FETCH', `Fetched fresh balances for ${address}`);
      }

      // Compute portfolio
      await computePortfolio();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
      addDebugEvent('LOAD_ERROR', error);
    } finally {
      loading = false;
    }
  }

  // Compute portfolio from raw data
  async function computePortfolio() {
    if (!rawOnchain.length) {
      portfolio = [];
      return;
    }

    // Get price data
    const tokenIds = rawOnchain
      .map(token => findCoinGeckoId(token.contract_address, token.symbol))
      .filter(Boolean);

    if (tokenIds.length > 0) {
      try {
        performanceMetrics.apiCalls++;
        const priceRes = await fetch(`/api/prices?ids=${tokenIds.join(',')}`);
        if (priceRes.ok) {
          cgResponse = await priceRes.json();
        }
      } catch {
        addDebugEvent('PRICE_ERROR', 'Failed to fetch prices');
      }
    }

    // Build portfolio
    portfolio = rawOnchain.map(token => ({
      symbol: get(symbolOverrideMap)[token.contract_address] || token.symbol,
      balance: parseFloat(token.balance),
      contractAddress: token.contract_address,
      chain: token.chain,
      coinGeckoId: findCoinGeckoId(token.contract_address, token.symbol),
      price: cgResponse && typeof cgResponse === 'object' && !('error' in cgResponse) 
        ? cgResponse[findCoinGeckoId(token.contract_address, token.symbol) || '']?.usd || 0 
        : 0
    })).map(item => ({
      ...item,
      value: item.balance * item.price
    }));

    addDebugEvent('PORTFOLIO_COMPUTED', `Portfolio computed with ${portfolio.length} tokens`);
  }

  // Find CoinGecko ID for token
  function findCoinGeckoId(contractAddress: string, symbol: string): string | null {
    const override = get(addressOverrideMap)[contractAddress];
    if (override) return override;

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

  // Load overrides from localStorage
  async function loadOverrides() {
    try {
      const addressOverrides = JSON.parse(localStorage.getItem(ADDR_OVR_KEY) || '{}');
      const symbolOverrides = JSON.parse(localStorage.getItem(SYMBOL_OVR_KEY) || '{}');
        addressOverrideMap.set(addressOverrides);
      symbolOverrideMap.set(symbolOverrides);
        addDebugEvent('OVERRIDES_LOADED', 'Overrides restored from localStorage');
    } catch {
      addDebugEvent('OVERRIDES_ERROR', 'Failed to load overrides');
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
  function handleAddressSubmit(event: CustomEvent<{ address: string }>) {
    address = event.detail.address;
    loadWalletData();
  }

  // Handle override updates
  function handleAddressOverride(event: CustomEvent<{contractAddress: string, coinGeckoId: string | null}>) {
    const { contractAddress, coinGeckoId } = event.detail;
    addressOverrideMap.update(map => ({
      ...map,
      [contractAddress]: coinGeckoId
    }));
    computePortfolio();
  }

  function handleSymbolOverride(event: CustomEvent<{contractAddress: string, symbol: string | null}>) {
    const { contractAddress, symbol } = event.detail;
    symbolOverrideMap.update(map => ({
      ...map,
      [contractAddress]: symbol
    }));
    computePortfolio();
  }
</script>

<div class="evm-address-balances">
  <AddressInput 
    bind:address
    {loading}
    {error}
    on:submit={handleAddressSubmit}
  />

  {#if portfolio.length > 0}
    <PortfolioDisplay 
      {portfolio}
      {loading}
    />
  {/if}

  <OverrideManager
    availableTokens={portfolio.map(item => ({
      symbol: item.symbol,
      contractAddress: item.contractAddress || '',
      chain: item.chain || 'eth'
    }))}
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
</style>
