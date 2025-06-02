<!-- Multi-Wallet EVMAddressBalances.svelte - Modern multi-wallet architecture -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived, get } from 'svelte/store';
    // Import our new modular components
  import MultiWalletHeader from '$lib/components/portfolio/evmultiwallet/MultiWalletHeader.svelte';
  import WalletSection from '$lib/components/portfolio/evmultiwallet/WalletSection.svelte';
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
  // Import wallet persistence service
  import { walletPersistenceService } from '$lib/services/wallet-persistence-service';
  import { supabaseMCPWalletService } from '$lib/services/supabase-mcp-wallet-service';
  import { authService } from '$lib/services/auth-service';
  import { supabase } from '$lib/supabaseClient';

  // STORAGE KEYS (for cache data only - user data will be in Supabase)
  const BALANCE_CACHE_PREFIX = 'wallet-balances-';
  const PRICE_CACHE_PREFIX = 'price-data-';
  // Multi-wallet state management using Svelte stores
  const walletsStore = writable<WalletData[]>([]);
  const globalPriceStore = writable<GlobalPriceResp>(null);
  const debugEventsStore = writable<DebugEvent[]>([]);
  const globalAddressOverrides = writable<OverrideMap>({});
  const globalSymbolOverrides = writable<OverrideMap>({});  // Authentication state
  let isAuthenticated = false;
  let authUser: any = null;

// Component state variables
  let error = '';
  let coinListError: string | null = null;
  let coinListLoading = false;
  let loadingPrices = false;
  let coinList: CoinListEntry[] = [];
  // Remove the old debugEvents array - now using debugEventsStore
  let refreshDetector: number | null = null;
  let performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheAttempts: 0
  };
  // Database data status tracking
  let hasDatabaseDataValue = false;
  let isInitializing = true; // Flag to prevent saving during startup

  // Derived stores for computed values
  const totalPortfolioValue = derived([walletsStore], ([$wallets]) => {
    return $wallets.reduce((total, wallet) => 
      total + wallet.portfolio.reduce((sum, item) => sum + item.value, 0), 0
    );
  });  const allUniqueTokenIds = derived(walletsStore, ($wallets) => {
    const tokenIds = new Set<string>();
    addDebugEvent('TOKEN_ID_DERIVE', `Deriving token IDs from ${$wallets.length} wallets, coinList has ${coinList.length} coins`);
    
    $wallets.forEach(wallet => {
      addDebugEvent('TOKEN_ID_WALLET', `Processing wallet ${wallet.label || wallet.address} with ${wallet.rawOnchain.length} tokens`);
      wallet.rawOnchain.forEach(token => {
        const id = findCoinGeckoId(token.contract_address, token.symbol, wallet.id);
        addDebugEvent('TOKEN_ID_LOOKUP', `Token ${token.symbol} (${token.contract_address}) -> ${id || 'NOT_FOUND'}`);
        if (id) tokenIds.add(id);
      });
    });
    
    const result = Array.from(tokenIds).sort();
    addDebugEvent('TOKEN_ID_RESULT', `Found ${result.length} unique token IDs: [${result.join(', ')}]`);
    return result;
  });

  // Derived store for existing wallet addresses to prevent duplicates
  const existingAddresses = derived(walletsStore, ($wallets) => {
    return $wallets.map(wallet => wallet.address.toLowerCase()).filter(Boolean);
  });

  // Reactive computed values
  $: wallets = $walletsStore;
  $: walletsCount = wallets.length;
  $: tokensCount = wallets.reduce((sum, w) => sum + w.portfolio.length, 0);
  $: chainsCount = new Set(wallets.flatMap(w => w.portfolio.map((p: any) => p.chain))).size;
  $: pricesLoaded = $globalPriceStore && typeof $globalPriceStore === 'object' && !('error' in $globalPriceStore) ? true : false;  // Debug info aggregator for DebugPanel
  $: debugPanelInfo = {
    refreshDetector,
    streamEvents: $debugEventsStore, // Use the reactive store directly
    cacheStatus: {
      healthy: !coinListError && coinList.length > 0,
      lastUpdate: coinList.length ? new Date().toISOString() : undefined,
      errors: coinListError ? [coinListError] : []
    } as CacheStatus,
    performanceMetrics,
    authStatus: {
      isAuthenticated,
      userEmail: authUser?.email || null,
      hasLocalData: hasLocalStorageData(),
      hasDatabaseData: hasDatabaseDataValue
    }
  };
  
  // Add debug logging to see what's being passed to DebugPanel
  $: {
    console.log('Debug Panel Info - streamEvents:', debugPanelInfo.streamEvents);
    console.log('Debug Panel Info - streamEvents length:', debugPanelInfo.streamEvents?.length);
    console.log('Debug Panel Info - debugEvents store:', $debugEventsStore);
    console.log('Debug Panel Info - debugEvents store length:', $debugEventsStore.length);
  }

  // Check if user has data in the database
  async function hasDatabaseData(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      return await walletPersistenceService.hasUserData(user.id);
    } catch (error) {
      console.error('Error checking database data:', error);
      return false;
    }
  }

  // Update database data status
  async function updateDatabaseDataStatus() {
    hasDatabaseDataValue = await hasDatabaseData();
  }
  // Check if localStorage has wallet data
  function hasLocalStorageData(): boolean {
    try {
      const walletData = localStorage.getItem('multi-wallet-list');
      const addrOverrides = localStorage.getItem('globalAddressOverrides');
      const symOverrides = localStorage.getItem('globalSymbolOverrides');
      
      return !!(walletData && walletData !== '[]') || 
             !!(addrOverrides && addrOverrides !== '{}') || 
             !!(symOverrides && symOverrides !== '{}');    } catch {
      return false;
    }
  }

// Initialize component
  onMount(async () => {
    // Add test debug event immediately to verify debug events are working
    addDebugEvent('TEST_EVENT', 'Debug events test - this should appear in debug panel');
    addDebugEvent('STREAM_TEST', 'Testing debug event streaming to logs/debug-stream.log');
    
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
    
    // Allow wallet saves after initialization is complete
    isInitializing = false;
    addDebugEvent('INIT_READY', 'Wallet persistence enabled - ready to save user changes');
  });
  // Set up debug infrastructure
  function setupDebugInfrastructure() {
    refreshDetector = setupSimpleRefreshDetection();
      // Subscribe to override changes for database persistence
    let saveOverridesTimeout: NodeJS.Timeout;    globalAddressOverrides.subscribe(async (addressOverrides) => {
      if (!isAuthenticated) {
        addDebugEvent('DB_SKIP', 'Address overrides changed but user not authenticated - skipping save');
        return;
      }
      
      // Debounce save operations
      clearTimeout(saveOverridesTimeout);
      saveOverridesTimeout = setTimeout(async () => {
        addDebugEvent('DB_SAVE_START', 'Starting global address overrides save operation');
        const symbolOverrides = get(globalSymbolOverrides);
        const result = await walletPersistenceService.saveGlobalOverrides(addressOverrides, symbolOverrides);
        if (result.success) {
          addDebugEvent('DB_SAVE', 'Global address overrides saved to database');
        } else {
          addDebugEvent('DB_ERROR', `Failed to save address overrides: ${result.error}`);
        }
      }, 1000);
    });
      globalSymbolOverrides.subscribe(async (symbolOverrides) => {
      if (!isAuthenticated) {
        addDebugEvent('DB_SKIP', 'Symbol overrides changed but user not authenticated - skipping save');
        return;
      }
      
      // Debounce save operations
      clearTimeout(saveOverridesTimeout);
      saveOverridesTimeout = setTimeout(async () => {
        addDebugEvent('DB_SAVE_START', 'Starting global symbol overrides save operation');
        const addressOverrides = get(globalAddressOverrides);
        const result = await walletPersistenceService.saveGlobalOverrides(addressOverrides, symbolOverrides);
        if (result.success) {
          addDebugEvent('DB_SAVE', 'Global symbol overrides saved to database');
        } else {
          addDebugEvent('DB_ERROR', `Failed to save symbol overrides: ${result.error}`);
        }
      }, 1000);
    });// Subscribe to wallet changes for database persistence
    let saveWalletsTimeout: NodeJS.Timeout;    walletsStore.subscribe(async (wallets) => {
      if (!isAuthenticated) {
        addDebugEvent('DB_SKIP', `Wallets changed (${wallets.length} wallets) but user not authenticated - skipping save`);
        return;
      }
      
      // Don't save during initialization to prevent empty wallet arrays
      if (isInitializing) {
        addDebugEvent('DB_SKIP', `Wallets changed during initialization (${wallets.length} wallets) - skipping save`);
        return;
      }
      
      // Debounce save operations
      clearTimeout(saveWalletsTimeout);
      saveWalletsTimeout = setTimeout(async () => {
        addDebugEvent('DB_SAVE_START', `Starting wallet configuration save operation (${wallets.length} wallets)`);
        const result = await walletPersistenceService.saveWalletConfiguration(wallets);
        if (result.success) {
          addDebugEvent('DB_SAVE', `Wallet configuration saved to database (${wallets.length} wallets)`);
        } else {
          addDebugEvent('DB_ERROR', `Failed to save wallet configuration: ${result.error}`);
        }
      }, 1000);
    });
  }
  // Restore application state from Supabase database
  async function restoreApplicationState() {
    // Check authentication status
    const sessionResult = await authService.getCurrentSession();    if (sessionResult.success && sessionResult.data) {      isAuthenticated = true;
      authUser = sessionResult.data.user;
      addDebugEvent('AUTH_CHECK', `User authenticated: ${authUser.email}`);
      
      // Update database data status
      await updateDatabaseDataStatus();
      
      // Load from database
      await loadFromDatabase();
    } else {
      isAuthenticated = false;
      addDebugEvent('AUTH_CHECK', 'User not authenticated - using fallback to localStorage');
      
      // Update database data status
      await updateDatabaseDataStatus();
      
      // Fallback to localStorage for unauthenticated users
      await loadFromLocalStorage();
    }
  }  // Load wallet data from Supabase database using MCP service
  async function loadFromDatabase() {
    try {      // Load global overrides
      const overridesResult = await walletPersistenceService.loadGlobalOverrides();
      if (overridesResult.success) {
        const overridesData = overridesResult.data as { addressOverrides: OverrideMap; symbolOverrides: OverrideMap };
        globalAddressOverrides.set(overridesData.addressOverrides);
        globalSymbolOverrides.set(overridesData.symbolOverrides);
        addDebugEvent('DB_LOAD', 'Global overrides loaded from database');
      }      // Load wallet configuration from wallet_settings table
      const walletResult = await walletPersistenceService.loadWalletConfiguration();
      let restoredWallets: WalletData[] = [];
      
      if (walletResult.success && walletResult.data) {
        const walletData = walletResult.data as { wallets: any[] };        if (walletData.wallets && walletData.wallets.length > 0) {
          restoredWallets = walletData.wallets.map((saved: any, index: number) => {
            const restoredWallet = {
              id: saved.id,
              address: saved.address || '',
              label: saved.label || '',
              rawOnchain: [],
              portfolio: [],
              loadingBalances: false,
              balancesLoaded: false,
              error: '',
              addressOverrides: saved.addressOverrides || {},
              symbolOverrides: saved.symbolOverrides || {},
              expanded: saved.expanded !== false
            };
            addDebugEvent('DB_WALLET_RESTORE', `Wallet ${index} (${saved.id}): expanded=${restoredWallet.expanded}, saved.expanded=${saved.expanded}`);
            return restoredWallet;
          });
          addDebugEvent('DB_LOAD', `Loaded ${restoredWallets.length} wallets from wallet_settings`);
        }
      }

      // Load wallet addresses using MCP service (replaces API call)
      try {
        addDebugEvent('DB_LOAD_START', 'Loading wallet addresses via MCP service');
        const addressResult = await supabaseMCPWalletService.getWalletAddresses();
          if (addressResult.success && addressResult.data) {
          const savedAddresses = addressResult.data;
          const existingAddresses = new Set(restoredWallets.map(w => w.address.toLowerCase()));
          
          // Create wallet entries for addresses that don't already exist
          const newWallets: WalletData[] = savedAddresses
            .filter((addr: any) => {
              const addressLower = addr.address?.toLowerCase();
              const isValid = addr.address && addressLower && !existingAddresses.has(addressLower);
              if (!isValid && addr.address) {
                addDebugEvent('DB_DUPLICATE_SKIPPED', `Skipped duplicate address from database: ${addr.address}`);
              }
              return isValid;
            })
            .map((addr: any) => ({
              id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              address: addr.address,
              label: addr.label || `Wallet ${addr.address.slice(0, 8)}...`,
              rawOnchain: [],
              portfolio: [],
              loadingBalances: false,
              balancesLoaded: false,
              error: '',
              addressOverrides: {},
              symbolOverrides: {},
              expanded: true
            }));
          
          if (newWallets.length > 0) {
            restoredWallets = [...restoredWallets, ...newWallets];
            addDebugEvent('DB_LOAD', `Added ${newWallets.length} wallets from MCP wallet_addresses query`);
          }
        } else {
          addDebugEvent('DB_LOAD', 'No wallet addresses found via MCP service');
        }
      } catch (error: any) {
        addDebugEvent('DB_ERROR', `Failed to load addresses via MCP: ${error.message}`);
      }

      if (restoredWallets.length > 0) {
        walletsStore.set(restoredWallets);
        addDebugEvent('DB_LOAD', `Total restored wallets via MCP: ${restoredWallets.length}`);
      } else {
        addDebugEvent('DB_LOAD', 'No wallets found in database via MCP');
      }
      
    } catch (error: any) {
      addDebugEvent('DB_ERROR', `Failed to load from database via MCP: ${error.message}`);
      // Fallback to localStorage on error
      await loadFromLocalStorage();
    }
  }

  // Fallback: Load wallet data from localStorage
  async function loadFromLocalStorage() {
    // Legacy storage keys for fallback
    const WALLET_LIST_KEY = 'multi-wallet-list';
    const GLOBAL_ADDR_OVR_KEY = 'globalAddressOverrides';
    const GLOBAL_SYMBOL_OVR_KEY = 'globalSymbolOverrides';
    
    // Load global overrides
    const globalAddrOverrides = JSON.parse(localStorage.getItem(GLOBAL_ADDR_OVR_KEY) || '{}');
    const globalSymOverrides = JSON.parse(localStorage.getItem(GLOBAL_SYMBOL_OVR_KEY) || '{}');
    globalAddressOverrides.set(globalAddrOverrides);
    globalSymbolOverrides.set(globalSymOverrides);

    // Load wallet list
    const savedWallets = JSON.parse(localStorage.getItem(WALLET_LIST_KEY) || '[]');
    if (savedWallets.length > 0) {
      const restoredWallets: WalletData[] = savedWallets.map((saved: any) => ({
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
        expanded: saved.expanded !== false
      }));
      walletsStore.set(restoredWallets);
      addDebugEvent('WALLETS_RESTORED', `Restored ${restoredWallets.length} wallets from localStorage`);
    }

    // Legacy single wallet migration
    const legacyAddress = localStorage.getItem('evmLastAddress');
    if (legacyAddress && savedWallets.length === 0) {
      await addWallet(legacyAddress, 'Migrated Wallet');
      addDebugEvent('LEGACY_MIGRATION', `Migrated legacy wallet: ${legacyAddress}`);
    }  }
  // Ensure coin list is available - loads from database with optional force refresh
  async function ensureCoinList(forceRefresh = false) {
    if (coinListLoading) return; // Prevent concurrent requests
    
    try {
      coinListLoading = true;
      
      // Build URL with force refresh parameter if needed
      const url = forceRefresh ? '/api/coinlist?force=true' : '/api/coinlist';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch coin list: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load coin list');
      }
      
      // Update the coinList variable with the loaded data
      if (data.data && Array.isArray(data.data)) {
        coinList = data.data;
        addDebugEvent('COINLIST_LOADED', `Coin list loaded: ${coinList.length} coins available`);
      } else {
        throw new Error('Invalid coin list data format');
      }
      
      // Clear any previous errors
      coinListError = null;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load coin list';
      coinListError = errorMsg;
      addDebugEvent('COINLIST_ERROR', `Error loading coin list: ${errorMsg}`);
      console.error('Error loading coin list:', error);
      // Don't throw - let the app continue with cached data
    } finally {
      coinListLoading = false;
    }
  }

  // Initialize data on component mount
  async function initializeData() {
    // Only load coinlist automatically, no wallet data
    await ensureCoinList();
  }
  // Check for cached data
  async function checkCachedData() {
    const currentWallets = get(walletsStore);
    let hasLoadedBalances = false;
    
    for (const wallet of currentWallets) {
      if (!wallet.address.trim()) continue;
      
      // Load cached balances for display (ignore TTL)
      const balanceKey = `${BALANCE_CACHE_PREFIX}${wallet.address.toLowerCase()}`;
      const rawItem = JSON.parse(localStorage.getItem(balanceKey) || 'null');
      if (rawItem?.data) {
        wallet.rawOnchain = rawItem.data;
        wallet.balancesLoaded = true;
        wallet.lastUpdated = new Date(rawItem.timestamp);
        hasLoadedBalances = true;
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
    
    // Important: Compute portfolios for wallets with loaded balances
    if (hasLoadedBalances) {
      addDebugEvent('PORTFOLIO_INIT', 'Computing portfolios from cached data');
      await recomputeAllPortfolios();
    }
  }  // Multi-wallet management functions
  async function addWallet(address: string = '', label: string = ''): Promise<string> {
    const trimmedAddress = address.trim();
    
    // Check for duplicate addresses if address is provided
    if (trimmedAddress) {
      const existingWallets = get(walletsStore);
      const duplicateWallet = existingWallets.find(wallet => 
        wallet.address.toLowerCase() === trimmedAddress.toLowerCase()
      );
      
      if (duplicateWallet) {
        const duplicateLabel = duplicateWallet.label || `Wallet ${duplicateWallet.address.slice(0, 8)}...`;
        addDebugEvent('WALLET_DUPLICATE_PREVENTED', `Prevented duplicate wallet: ${trimmedAddress} (already exists as "${duplicateLabel}")`);
        
        // Show user-friendly error
        alert(`This wallet address is already added as "${duplicateLabel}". Please use a different address.`);
        return duplicateWallet.id; // Return existing wallet ID
      }
    }
    
    const walletId = `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newWallet: WalletData = {
      id: walletId,
      address: trimmedAddress,
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
    addDebugEvent('WALLET_ADDED', `Added wallet: ${label || trimmedAddress || 'Empty wallet'}`);
    return walletId;
  }async function removeWallet(walletId: string) {
    const wallets = get(walletsStore);
    const wallet = wallets.find((w: WalletData) => w.id === walletId);
    
    if (!wallet) {
      addDebugEvent('WALLET_REMOVE_ERROR', `Wallet not found: ${walletId}`);
      return;
    }

    // If authenticated and wallet has an address, remove from database using MCP service
    if (isAuthenticated && wallet.address.trim()) {
      try {
        addDebugEvent('WALLET_REMOVE_START', `Removing wallet from database via MCP: ${wallet.label || wallet.address}`);
          // Use MCP service for direct database access
        const result = await supabaseMCPWalletService.deleteWalletAddress(wallet.id, wallet.address.trim());

        if (result.success) {
          addDebugEvent('WALLET_REMOVE_SUCCESS', `Successfully removed wallet from database via MCP: ${wallet.label || wallet.address}`);
        } else {
          throw new Error(result.error || 'MCP service failed to remove wallet');
        }
        
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove wallet from database via MCP';
        addDebugEvent('WALLET_REMOVE_ERROR', `Database removal via MCP failed for wallet ${walletId}: ${errorMessage}`);
        console.error('Wallet removal error via MCP:', error);
        // Continue with local removal even if database removal fails
      }
    }

    // Remove from local store
    walletsStore.update((wallets: WalletData[]) => wallets.filter((w: WalletData) => w.id !== walletId));
    addDebugEvent('WALLET_REMOVED', `Removed wallet locally: ${wallet.label || wallet.address || walletId}`);
  }  function updateWallet(updatedWallet: WalletData) {
    console.log('[EVMAddressBalances] updateWallet called for:', updatedWallet.id);
    console.log('[EVMAddressBalances] updateWallet expanded state:', updatedWallet.expanded);
    console.log('[EVMAddressBalances] updateWallet full data:', updatedWallet);
    
    // Just update the store directly without any sanitization
    // Let the wallet component handle its own expansion state
    walletsStore.update((wallets: WalletData[]) => 
      wallets.map((w: WalletData) => w.id === updatedWallet.id ? updatedWallet : w)
    );
    
    console.log('[EVMAddressBalances] walletsStore updated');
  }
  // Individual wallet balance loading
  async function loadWalletBalances(walletId: string) {
    addDebugEvent('LOAD_BALANCE_START', `loadWalletBalances called for wallet ID: ${walletId}`);
    
    const wallets = get(walletsStore);
    const wallet = wallets.find((w: WalletData) => w.id === walletId);
    
    if (!wallet) {
      addDebugEvent('LOAD_BALANCE_ERROR', `Wallet not found with ID: ${walletId}`);
      return;
    }
    
    if (!wallet.address.trim()) {
      addDebugEvent('LOAD_BALANCE_ERROR', `Wallet ${wallet.label || walletId} has no address set`);
      return;
    }

    addDebugEvent('LOAD_BALANCE_PROCEED', `Loading balances for wallet: ${wallet.label || wallet.address} (${wallet.address})`);

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
  }  // Global price loading for all wallets
  async function loadAllPrices() {
    console.log('EVMAddressBalances: loadAllPrices function called');
    addDebugEvent('LOAD_ALL_PRICES_START', 'Load All Prices button triggered - starting price loading');
    
    // Ensure coin list is loaded before trying to find token IDs
    await ensureCoinList();
    addDebugEvent('LOAD_ALL_PRICES_COINLIST', `Coin list ensured - ${coinList.length} coins available`);
    
    const tokenIds = get(allUniqueTokenIds);
    addDebugEvent('LOAD_ALL_PRICES_TOKEN_CHECK', `Found ${tokenIds.length} unique token IDs after coin list check`);
    
    if (tokenIds.length === 0) {
      error = 'No tokens found across all wallets';
      addDebugEvent('LOAD_ALL_PRICES_ERROR', 'No tokens found across all wallets');
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
    addDebugEvent('FIND_COINGECKO_START', `Looking for CoinGecko ID: ${symbol} (${contractAddress}), coinList length: ${coinList.length}`);
    
    // Check wallet-specific overrides first
    if (walletId) {
      const wallet = get(walletsStore).find((w: WalletData) => w.id === walletId);
      if (wallet?.addressOverrides[contractAddress]) {
        addDebugEvent('FIND_COINGECKO_WALLET_OVERRIDE', `Found wallet override for ${contractAddress}: ${wallet.addressOverrides[contractAddress]}`);
        return wallet.addressOverrides[contractAddress];
      }
    }

    // Check global overrides
    const globalAddrOverrides = get(globalAddressOverrides);
    if (globalAddrOverrides[contractAddress]) {
      addDebugEvent('FIND_COINGECKO_GLOBAL_OVERRIDE', `Found global override for ${contractAddress}: ${globalAddrOverrides[contractAddress]}`);
      return globalAddrOverrides[contractAddress];
    }

    // Search by contract address in platforms
    for (const coin of coinList) {
      if (coin.platforms) {
        const addresses = Object.values(coin.platforms);
        if (addresses.some((addr: any) => addr && addr.toLowerCase() === contractAddress.toLowerCase())) {
          addDebugEvent('FIND_COINGECKO_PLATFORM_MATCH', `Found platform match for ${contractAddress}: ${coin.id}`);
          return coin.id;
        }
      }
    }

    // Fallback to symbol match
    const symbolMatch = coinList.find(coin => 
      coin.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (symbolMatch?.id) {
      addDebugEvent('FIND_COINGECKO_SYMBOL_MATCH', `Found symbol match for ${symbol}: ${symbolMatch.id}`);
      return symbolMatch.id;
    }
    
    addDebugEvent('FIND_COINGECKO_NO_MATCH', `No CoinGecko ID found for ${symbol} (${contractAddress})`);
    return null;
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
  }  // Debug event tracker
  function addDebugEvent(type: string, message: string) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      message
    } as DebugEvent;
    
    // Add to store (keep last 50 events) - this will trigger reactivity
    debugEventsStore.update(events => [
      ...events.slice(-49),
      event
    ]);
    
    // Stream to log file
    streamEventToLog(event);
  }
  
  // Stream debug events to log file
  async function streamEventToLog(event: DebugEvent) {
    try {
      const logEntry = `[${event.timestamp}] ${event.type}: ${event.message}\n`;
      
      // Send to our debug stream API endpoint
      await fetch('/api/system/debug-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry: logEntry,
          timestamp: event.timestamp,
          type: event.type,
          message: event.message
        })
      }).catch(error => {
        // Silently fail if API is not available
        console.warn('Failed to stream debug event to log:', error);
      });
    } catch (error) {
      // Silently fail to avoid breaking the app
      console.warn('Debug event streaming error:', error);
    }
  }

  // Simple refresh detection
  function setupSimpleRefreshDetection(): number {
    return window.setInterval(async () => {
      // Check auth status periodically
      const sessionResult = await authService.getCurrentSession();
      const wasAuthenticated = isAuthenticated;
      isAuthenticated = sessionResult.success && !!sessionResult.data;        if (wasAuthenticated !== isAuthenticated) {
        addDebugEvent('AUTH_CHANGE', `Authentication status changed: ${isAuthenticated ? 'logged in' : 'logged out'}`);
        
        // Update database data status
        await updateDatabaseDataStatus();
        
        if (isAuthenticated) {
          // User just logged in - load from database
          await loadFromDatabase();
        } else {
          // User logged out - fall back to localStorage
          await loadFromLocalStorage();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  // Data migration functions
  async function migrateToDatabase() {
    if (!isAuthenticated) {
      addDebugEvent('MIGRATION_ERROR', 'User must be logged in to migrate data');
      return false;
    }

    try {
      addDebugEvent('MIGRATION_START', 'Starting migration from localStorage to database');
      
      const result = await walletPersistenceService.migrateFromLocalStorage();
      if (result.success) {
        addDebugEvent('MIGRATION_SUCCESS', 'Successfully migrated data to database');
        
        // Reload from database to verify
        await loadFromDatabase();
        return true;
      } else {
        addDebugEvent('MIGRATION_ERROR', `Migration failed: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      addDebugEvent('MIGRATION_ERROR', `Migration error: ${error.message}`);
      return false;
    }
  }

  async function clearDatabaseData() {
    if (!isAuthenticated) {
      addDebugEvent('CLEAR_ERROR', 'User must be logged in to clear database data');
      return false;
    }

    try {
      const result = await walletPersistenceService.clearAllWalletData();
      if (result.success) {
        addDebugEvent('CLEAR_SUCCESS', 'Successfully cleared all wallet data from database');
        
        // Clear local stores
        walletsStore.set([]);
        globalAddressOverrides.set({});
        globalSymbolOverrides.set({});
        return true;
      } else {
        addDebugEvent('CLEAR_ERROR', `Clear failed: ${result.error}`);
        return false;
      }
    } catch (error: any) {
      addDebugEvent('CLEAR_ERROR', `Clear error: ${error.message}`);
      return false;
    }
  }
  // Event handlers
  async function handleAddWallet() {
    await addWallet();
  }  // Handle address save events from wallet sections - Using MCP Service
  async function handleAddressSave(event: CustomEvent<{ walletId: string; address: string; label?: string }>) {
    const { walletId, address, label } = event.detail;
    
    if (!address?.trim()) {
      addDebugEvent('ADDRESS_SAVE_ERROR', 'Cannot save empty address');
      return;
    }

    const trimmedAddress = address.trim();
    
    // Check for duplicate addresses in other wallets
    const existingWallets = get(walletsStore);
    const duplicateWallet = existingWallets.find(wallet => 
      wallet.id !== walletId && // Exclude current wallet
      wallet.address.toLowerCase() === trimmedAddress.toLowerCase()
    );
    
    if (duplicateWallet) {
      const duplicateLabel = duplicateWallet.label || `Wallet ${duplicateWallet.address.slice(0, 8)}...`;
      addDebugEvent('ADDRESS_DUPLICATE_PREVENTED', `Prevented duplicate address save: ${trimmedAddress} (already exists as "${duplicateLabel}")`);
      
      // Show user-friendly error
      alert(`This wallet address is already used by "${duplicateLabel}". Please use a different address.`);
      return;
    }

    // Check authentication status
    if (!isAuthenticated) {
      addDebugEvent('ADDRESS_SAVE_ERROR', 'User not authenticated - cannot save to database');
      return;
    }

    try {
      addDebugEvent('ADDRESS_SAVE_START', `Saving address via MCP for wallet ${walletId}: ${trimmedAddress}`);
        // Use MCP service for direct database access
      const result = await supabaseMCPWalletService.saveWalletAddress({
        id: walletId,
        address: trimmedAddress,
        label: label?.trim() || `Wallet ${trimmedAddress.slice(0, 8)}...`
      });

      if (result.success) {
        addDebugEvent('ADDRESS_SAVE_SUCCESS', `Successfully saved address via MCP for wallet ${walletId}: ${trimmedAddress}${label ? ` (${label})` : ''}`);
          // Update the wallet in the store with the saved data
        const wallets = get(walletsStore);
        const walletIndex = wallets.findIndex(w => w.id === walletId);
        if (walletIndex !== -1 && wallets[walletIndex]) {
          wallets[walletIndex].address = trimmedAddress;
          if (label?.trim()) {
            wallets[walletIndex].label = label.trim();
          }
          walletsStore.set(wallets);
        }
      } else {
        throw new Error(result.error || 'MCP service failed to save address');
      }
      
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address via MCP';
      addDebugEvent('ADDRESS_SAVE_ERROR', `Failed to save address for wallet ${walletId}: ${errorMessage}`);
      console.error('Address save error via MCP:', error);
    }
  }

  // Debug panel event handlers
  async function handleRefreshCoinList() {
    await ensureCoinList(true); // Force refresh
  }

  async function handleRefreshBalances() {
    const wallets = get(walletsStore);
    for (const wallet of wallets) {
      if (wallet.address.trim()) {
        await loadWalletBalances(wallet.id);
      }
    }
  }
  function handleClearDebugEvents() {
    debugEventsStore.set([]);
    addDebugEvent('EVENTS_CLEARED', 'Debug events cleared');
  }
  function handleExportDebugData() {
    const exportData = {
      debugEvents: get(debugEventsStore),
      performanceMetrics,
      wallets: get(walletsStore).map(w => ({
        id: w.id,
        label: w.label,
        address: w.address,
        balancesLoaded: w.balancesLoaded,
        portfolioCount: w.portfolio.length,
        lastUpdated: w.lastUpdated
      })),
      globalOverrides: {
        address: get(globalAddressOverrides),
        symbol: get(globalSymbolOverrides)
      },
      authStatus: {
        isAuthenticated,
        hasLocalData: hasLocalStorageData()
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-debug-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addDebugEvent('DEBUG_EXPORTED', 'Debug data exported to file');
  }

  // Migration event handlers
  async function handleMigrateToDatabase() {
    const success = await migrateToDatabase();
    if (success) {
      addDebugEvent('MIGRATION_UI', 'Migration triggered from debug panel');
    }
  }

  async function handleClearDatabaseData() {
    const success = await clearDatabaseData();
    if (success) {
      addDebugEvent('CLEAR_UI', 'Database clear triggered from debug panel');
    }
  }

  async function handleLoadFromDatabase() {
    await loadFromDatabase();
    addDebugEvent('RELOAD_UI', 'Database reload triggered from debug panel');
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
    {pricesLoaded}    on:addWallet={handleAddWallet}
    on:loadAllPrices={loadAllPrices}
  />
  <!-- Individual Wallet Sections -->
  <div class="space-y-4">
    {#each wallets as wallet, index (wallet.id)}      <WalletSection
        {wallet}
        walletIndex={index}
        globalPriceResponse={$globalPriceStore}
        {coinList}
        existingAddresses={$existingAddresses}
        on:updateWallet={(e) => updateWallet(e.detail)}
        on:removeWallet={(e) => removeWallet(e.detail)}
        on:loadBalances={(e) => loadWalletBalances(e.detail)}
        on:addressSubmit={(e) => loadWalletBalances(e.detail.walletId)}
        on:addressSave={handleAddressSave}
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
      </div>    {/if}
  </div>  // Debug Panel (Development Only)
  {#if import.meta.env.DEV}
    <DebugPanel 
      debugInfo={debugPanelInfo}
      coinListLoading={coinListLoading}
      coinListError={coinListError}
      balancesLoading={loadingPrices}
      on:refreshCoinList={handleRefreshCoinList}
      on:refreshBalances={handleRefreshBalances}
      on:clearDebugEvents={handleClearDebugEvents}
      on:exportDebugData={handleExportDebugData}
      on:migrateToDatabase={handleMigrateToDatabase}
      on:clearDatabaseData={handleClearDatabaseData}
      on:loadFromDatabase={handleLoadFromDatabase}
    />
  {/if}

</div><style>
  /* Minimal custom styles - most styling handled by Tailwind */
</style>
