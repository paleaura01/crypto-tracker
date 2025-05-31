<!-- Multi-Wallet EVMAddressBalances.svelte - Modern multi-wallet architecture -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived, get } from 'svelte/store';
  
  // Import our new modular components
  import MultiWalletHeader from '$lib/components/portfolio/evmultiwallet/MultiWalletHeader.svelte';
  import WalletSection from '$lib/components/portfolio/evmultiwallet/WalletSection.svelte';
  import OverrideManager from '$lib/components/portfolio/evmultiwallet/OverrideManager.svelte';
  import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
    // Import types
  import type {
    WalletData,
    DebugEvent,
    PerformanceMetrics,
    CacheStatus,
    OverrideMap,
    CoinListEntry,
    GlobalPriceResp
  } from '$lib/components/types';

  // STORAGE KEYS
  const WALLET_LIST_KEY = 'multi-wallet-list';
  const GLOBAL_ADDR_OVR_KEY = 'globalAddressOverrides';
  const GLOBAL_SYMBOL_OVR_KEY = 'globalSymbolOverrides';
  const BALANCE_CACHE_PREFIX = 'wallet-balances-';
  const PRICE_CACHE_PREFIX = 'price-data-';

  // Multi-wallet state management using Svelte stores
  const walletsStore = writable<WalletData[]>([]);
  const globalPriceStore = writable<GlobalPriceResp>(null);
  const globalAddressOverrides = writable<OverrideMap>({});
  const globalSymbolOverrides = writable<OverrideMap>({});

  // Component state variables
  let error = '';
  let coinListError: string | null = null;
  let loadingPrices = false;
  let showAdvancedCard = false;
  let coinList: CoinListEntry[] = [];
  let debugEvents: DebugEvent[] = [];
  let refreshDetector: number | null = null;
  let performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheAttempts: 0
  };

  // Derived stores for computed values
  const totalPortfolioValue = derived([walletsStore], ([$wallets]) => {
    return $wallets.reduce((total, wallet) => 
      total + wallet.portfolio.reduce((sum, item) => sum + item.value, 0), 0
    );
  });

  const allUniqueTokenIds = derived(walletsStore, ($wallets) => {
    const tokenIds = new Set<string>();
    $wallets.forEach(wallet => {
      wallet.rawOnchain.forEach(token => {
        const id = findCoinGeckoId(token.contract_address, token.symbol, wallet.id);
        if (id) tokenIds.add(id);
      });
    });
    return Array.from(tokenIds).sort();
  });

  // Reactive computed values
  $: wallets = $walletsStore;
  $: walletsCount = wallets.length;
  $: tokensCount = wallets.reduce((sum, w) => sum + w.portfolio.length, 0);
  $: chainsCount = new Set(wallets.flatMap(w => w.portfolio.map((p: any) => p.chain))).size;
  $: pricesLoaded = $globalPriceStore && typeof $globalPriceStore === 'object' && !('error' in $globalPriceStore) ? true : false;
  // Debug info aggregator
  $: debugInfo = {
    refreshDetector,
    streamEvents: debugEvents,
    cacheStatus: {
      healthy: !coinListError && coinList.length > 0,
      lastUpdate: coinList.length ? new Date().toISOString() : undefined,
      errors: coinListError ? [coinListError] : []
    } as CacheStatus,
    performanceMetrics
  };// Initialize component
  onMount(async () => {
    const startTime = performance.now();
    
    // Set up debugging and monitoring
    setupDebugInfrastructure();
    
    // Restore previous state (load wallets + overrides)
    await restoreApplicationState();
    
    // Load initial data (coin list)
    await initializeData();
    
    // After coin list is available, apply any cached data
    await checkCachedData();
    
    // Track performance
    performanceMetrics.loadTime = Math.round(performance.now() - startTime);
    addDebugEvent('INIT_COMPLETE', `Multi-wallet component initialized in ${performanceMetrics.loadTime}ms`);
  });

  // Set up debug infrastructure
  function setupDebugInfrastructure() {
    refreshDetector = setupSimpleRefreshDetection();
    
    // Subscribe to override changes for localStorage backup
    globalAddressOverrides.subscribe(m => {
      localStorage.setItem(GLOBAL_ADDR_OVR_KEY, JSON.stringify(m));
    });
    
    globalSymbolOverrides.subscribe(m => {
      localStorage.setItem(GLOBAL_SYMBOL_OVR_KEY, JSON.stringify(m));
    });

    // Subscribe to wallet changes for persistence
    walletsStore.subscribe(wallets => {
      const walletSaveData = wallets.map(w => ({
        id: w.id,
        address: w.address,
        label: w.label,
        expanded: w.expanded,
        addressOverrides: w.addressOverrides,
        symbolOverrides: w.symbolOverrides
      }));
      localStorage.setItem(WALLET_LIST_KEY, JSON.stringify(walletSaveData));
    });
  }

  // Restore application state from localStorage
  async function restoreApplicationState() {
    // Load global overrides
    const globalAddrOverrides = JSON.parse(localStorage.getItem(GLOBAL_ADDR_OVR_KEY) || '{}');
    const globalSymOverrides = JSON.parse(localStorage.getItem(GLOBAL_SYMBOL_OVR_KEY) || '{}');
    globalAddressOverrides.set(globalAddrOverrides);
    globalSymbolOverrides.set(globalSymOverrides);

    // Load wallet list
    const savedWallets = JSON.parse(localStorage.getItem(WALLET_LIST_KEY) || '[]');
    if (savedWallets.length > 0) {      const restoredWallets: WalletData[] = savedWallets.map((saved: any) => ({
        id: saved.id,
        address: saved.address || '',
        label: saved.label,
        rawOnchain: [],
        portfolio: [],
        loadingBalances: false,
        balancesLoaded: false,
        error: '',
        addressOverrides: saved.addressOverrides || {},
        symbolOverrides: saved.symbolOverrides || {},
        expanded: saved.expanded !== false // Default to expanded
      }));
      walletsStore.set(restoredWallets);
      addDebugEvent('WALLETS_RESTORED', `Restored ${restoredWallets.length} wallets from localStorage`);
    }

    // Legacy single wallet migration
    const legacyAddress = localStorage.getItem('evmLastAddress');
    if (legacyAddress && savedWallets.length === 0) {
      await addWallet(legacyAddress, 'Migrated Wallet');
      addDebugEvent('LEGACY_MIGRATION', `Migrated legacy wallet: ${legacyAddress}`);
    }
  }

  // Initialize core data
  async function initializeData() {
    // Only load coinlist automatically, no wallet data
    await ensureCoinList();
  }

  // Check for cached data
  async function checkCachedData() {
    const currentWallets = get(walletsStore);
    
    for (const wallet of currentWallets) {
      if (!wallet.address.trim()) continue;
      
      // Load cached balances for display (ignore TTL)
      const balanceKey = `${BALANCE_CACHE_PREFIX}${wallet.address.toLowerCase()}`;
      const rawItem = JSON.parse(localStorage.getItem(balanceKey) || 'null');
      if (rawItem?.data) {
        wallet.rawOnchain = rawItem.data;
        wallet.balancesLoaded = true;
        wallet.lastUpdated = new Date(rawItem.timestamp);
        addDebugEvent('LOCAL_BALANCES_LOADED', `Loaded cached balances for wallet ${wallet.label || wallet.address}`);
      }
    }
    
    // Update wallets store
    walletsStore.set(currentWallets);
    
    // Load cached prices for display if any wallets have tokens
    const allTokenIds = get(allUniqueTokenIds);
    if (allTokenIds.length > 0) {
      const priceKey = `${PRICE_CACHE_PREFIX}${allTokenIds.join(',')}`;
      const priceItem = JSON.parse(localStorage.getItem(priceKey) || 'null');
      if (priceItem?.data) {
        globalPriceStore.set(priceItem.data);
        addDebugEvent('LOCAL_PRICES_LOADED', 'Loaded cached prices for all wallets');
      }
    }
  }
  // Multi-wallet management functions
  async function addWallet(address: string = '', label: string = ''): Promise<string> {
    const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newWallet: WalletData = {
      id: walletId,
      address: address.trim(),
      label: label || `Wallet ${walletsCount + 1}`,
      rawOnchain: [],
      portfolio: [],
      loadingBalances: false,
      balancesLoaded: false,
      error: '',
      addressOverrides: {},
      symbolOverrides: {},
      expanded: true
    };
    
    walletsStore.update(wallets => [...wallets, newWallet]);
    addDebugEvent('WALLET_ADDED', `Added wallet: ${label || address || 'Empty wallet'}`);
    return walletId;
  }

  function removeWallet(walletId: string) {
    walletsStore.update((wallets: WalletData[]) => wallets.filter((w: WalletData) => w.id !== walletId));
    addDebugEvent('WALLET_REMOVED', `Removed wallet: ${walletId}`);
  }

  function updateWallet(updatedWallet: WalletData) {
    walletsStore.update((wallets: WalletData[]) => 
      wallets.map((w: WalletData) => w.id === updatedWallet.id ? updatedWallet : w)
    );
  }

  // Individual wallet balance loading
  async function loadWalletBalances(walletId: string) {
    const wallets = get(walletsStore);
    const wallet = wallets.find((w: WalletData) => w.id === walletId);
    if (!wallet || !wallet.address.trim()) return;

    // Update loading state
    wallet.loadingBalances = true;
    wallet.error = '';
    updateWallet(wallet);

    try {
      await ensureCoinList();

      performanceMetrics.apiCalls++;
      const res = await fetch(`/api/wallet/balances/${wallet.address.toLowerCase()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      wallet.rawOnchain = await res.json();
      wallet.balancesLoaded = true;
      wallet.lastUpdated = new Date();
      
      // Cache the balance data
      const balanceKey = `${BALANCE_CACHE_PREFIX}${wallet.address.toLowerCase()}`;
      setCachedData(balanceKey, wallet.rawOnchain);
      
      addDebugEvent('BALANCES_LOADED', `Loaded ${wallet.rawOnchain.length} tokens for wallet ${wallet.label || wallet.address}`);
      
      // Compute portfolio for this wallet
      await computeWalletPortfolio(wallet);
      
    } catch (e: unknown) {
      wallet.error = e instanceof Error ? e.message : 'Unknown error occurred';
      addDebugEvent('BALANCE_ERROR', `${wallet.label || wallet.address}: ${wallet.error}`);
    } finally {
      wallet.loadingBalances = false;
      updateWallet(wallet);
    }
  }

  // Global price loading for all wallets
  async function loadAllPrices() {
    const tokenIds = get(allUniqueTokenIds);
    if (tokenIds.length === 0) {
      error = 'No tokens found across all wallets';
      return;
    }

    loadingPrices = true;
    error = '';

    try {
      performanceMetrics.apiCalls++;
      const priceRes = await fetch(`/api/prices?ids=${tokenIds.join(',')}`);
      if (!priceRes.ok) throw new Error(`HTTP ${priceRes.status}`);
      
      const priceResponse = await priceRes.json();
      globalPriceStore.set(priceResponse);
      
      // Cache the price data
      const priceKey = `${PRICE_CACHE_PREFIX}${tokenIds.join(',')}`;
      setCachedData(priceKey, priceResponse);
      
      addDebugEvent('PRICES_LOADED', `Loaded prices for ${tokenIds.length} unique tokens across all wallets`);
      
      // Recompute portfolios for all wallets
      await recomputeAllPortfolios();
      
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Unknown error occurred';
      addDebugEvent('PRICE_ERROR', error);
    } finally {
      loadingPrices = false;
    }
  }

  // Portfolio computation functions
  async function computeWalletPortfolio(wallet: WalletData) {
    if (!wallet.rawOnchain.length) {
      wallet.portfolio = [];
      updateWallet(wallet);
      return;
    }

    const priceResponse = get(globalPriceStore);
    wallet.portfolio = wallet.rawOnchain.map((token: any) => {
      const balanceNum = parseFloat(token.balance);
      const id = findCoinGeckoId(token.contract_address, token.symbol, wallet.id) || '';
      const price = priceResponse && typeof priceResponse === 'object' && !('error' in priceResponse)
        ? (priceResponse as any)[id]?.usd || 0
        : 0;
      
      return {
        symbol: getSymbolForToken(token.contract_address, token.symbol, wallet.id),
        balance: balanceNum,
        contractAddress: token.contract_address,
        chain: token.chain,
        coinGeckoId: id || null,
        price,
        value: balanceNum * price
      };
    });
    
    updateWallet(wallet);
    addDebugEvent('PORTFOLIO_COMPUTED', `Portfolio computed for wallet ${wallet.label || wallet.address} with ${wallet.portfolio.length} tokens`);
  }

  async function recomputeAllPortfolios() {
    const wallets = get(walletsStore);
    for (const wallet of wallets) {
      if (wallet.rawOnchain.length > 0) {
        await computeWalletPortfolio(wallet);
      }
    }
  }

  // Enhanced CoinGecko ID finder with wallet-specific overrides
  function findCoinGeckoId(contractAddress: string, symbol: string, walletId?: string): string | null {
    // Check wallet-specific overrides first
    if (walletId) {
      const wallet = get(walletsStore).find((w: WalletData) => w.id === walletId);
      if (wallet?.addressOverrides[contractAddress]) {
        return wallet.addressOverrides[contractAddress];
      }
    }

    // Check global overrides
    const globalAddrOverrides = get(globalAddressOverrides);
    if (globalAddrOverrides[contractAddress]) {
      return globalAddrOverrides[contractAddress];
    }

    // Search by contract address in platforms
    for (const coin of coinList) {
      if (coin.platforms) {
        const addresses = Object.values(coin.platforms);
        if (addresses.some((addr: any) => addr && addr.toLowerCase() === contractAddress.toLowerCase())) {
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

  // Enhanced symbol getter with wallet-specific overrides
  function getSymbolForToken(contractAddress: string, defaultSymbol: string, walletId?: string): string {
    // Check wallet-specific symbol overrides first
    if (walletId) {
      const wallet = get(walletsStore).find((w: WalletData) => w.id === walletId);
      if (wallet?.symbolOverrides[contractAddress]) {
        return wallet.symbolOverrides[contractAddress] || defaultSymbol;
      }
    }

    // Check global symbol overrides
    const globalSymOverrides = get(globalSymbolOverrides);
    if (globalSymOverrides[contractAddress]) {
      return globalSymOverrides[contractAddress] || defaultSymbol;
    }

    return defaultSymbol;
  }

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
      addDebugEvent('HEARTBEAT', 'Multi-wallet component still active');
    }, 30000);
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

  // Advanced settings toggle
  function handleShowAdvanced() {
    showAdvancedCard = true;
  }

  // Event handlers
  async function handleAddWallet() {
    await addWallet();
  }
</script>

<!-- Multi-Wallet EVM Portfolio Tracker -->
<div class="w-full max-w-4xl mx-auto p-4 space-y-6">
  <!-- Global Portfolio Header -->
  <MultiWalletHeader 
    totalPortfolioValue={$totalPortfolioValue}
    {walletsCount}
    {tokensCount}
    {chainsCount}
    {loadingPrices}
    {pricesLoaded}
    on:addWallet={handleAddWallet}
    on:loadAllPrices={loadAllPrices}
    on:showAdvanced={handleShowAdvanced}
  />
  <!-- Individual Wallet Sections -->
  <div class="space-y-4">    {#each wallets as wallet (wallet.id)}      <WalletSection
        {wallet}
        globalPriceResponse={$globalPriceStore}
        on:updateWallet={(e) => updateWallet(e.detail)}
        on:removeWallet={(e) => removeWallet(e.detail)}
        on:loadBalances={(e) => loadWalletBalances(e.detail)}
      />
    {/each}
    
    {#if wallets.length === 0}
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        <div class="text-6xl mb-4">🚀</div>
        <div class="text-lg font-medium text-gray-600 mb-2">Welcome to Multi-Wallet Tracker</div>
        <div class="text-sm text-gray-500 mb-6">Add your first wallet address to get started tracking your crypto portfolio</div>        <button
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
          on:click={handleAddWallet}
        >
          Add Your First Wallet
        </button>
      </div>
    {/if}
  </div>

  <!-- Advanced Settings Panel -->
  {#if showAdvancedCard}
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Advanced Settings</h3>
          <button 
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            on:click={() => showAdvancedCard = false}
            title="Close Advanced Settings"
          >
            <span class="text-xl">×</span>
          </button>
        </div>
      </div>
      
      <div class="p-6">        <OverrideManager 
          {coinList}
          addressOverrides={$globalAddressOverrides}
          symbolOverrides={$globalSymbolOverrides}
          on:updateGlobalAddressOverrides={(e) => globalAddressOverrides.set(e.detail)}
          on:updateGlobalSymbolOverrides={(e) => globalSymbolOverrides.set(e.detail)}
        />
      </div>
    </div>
  {/if}
  <!-- Debug Panel (Development Only) -->
  {#if import.meta.env.DEV && debugInfo}
    <DebugPanel {debugInfo} />
  {/if}

</div><style>
  /* Minimal custom styles - most styling handled by Tailwind */
</style>
