<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  
  export let symbolOverrides: Record<string, string | null> = {};
  export let addressOverrides: Record<string, string | null> = {};
  export let availableTokens: Array<{ symbol: string; contractAddress: string; chain: string }> = [];
  export let coinList: Array<{ id: string; symbol: string; name: string }> = [];
  export let disabled: boolean = false;
  
  // Wallet context for API calls
  export let walletAddress: string = '';
  export let walletId: string = '';
  
  const dispatch = createEventDispatcher<{
    symbolOverride: { contractAddress: string; symbol: string | null };
    addressOverride: { contractAddress: string; coinGeckoId: string | null };
    overridesChanged: void; // New event to notify parent of changes
  }>();
    let activeTab: 'symbols' | 'addresses' = 'symbols';
  let editingSymbol: string | null = null;
  let editingAddress: string | null = null;
  let editSymbolCgId = '';
  let editAddressCgId = '';
  let searchQuery = '';
  let saving = false; // Loading state for API calls
  // API helper functions
  async function saveOverrideToAPI(type: 'symbol' | 'address', contractAddress: string, value: string | null, action: 'upsert' | 'delete' = 'upsert', symbol?: string): Promise<boolean> {
    if (!walletAddress || !walletId) {
      console.error('Wallet context missing for override save');
      return false;
    }
    
    try {
      saving = true;
      
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }
      
      const payload: any = {
        contractAddress: contractAddress.toLowerCase(),
        chain: 'eth',
        overrideType: type === 'symbol' ? 'symbol' : 'address',
        overrideValue: value,
        walletAddress,
        action
      };
      
      // For symbol overrides, include the symbol name
      if (type === 'symbol' && symbol) {
        payload.symbol = symbol.toUpperCase();
      }
      
      const response = await fetch('/api/overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save override:', error);
      alert(`Failed to save override: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      saving = false;
    }
  }  async function loadWalletOverrides(): Promise<void> {
    if (!walletAddress) return;
    
    try {
      console.log(`Loading overrides for wallet: ${walletAddress}`);
      
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Not authenticated for loading overrides');
        return;
      }
        const response = await fetch(`/api/overrides?wallet_address=${encodeURIComponent(walletAddress)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();      if (response.ok) {
        // Process symbol overrides - the API now returns them keyed by symbol already
        const newSymbolOverrides: Record<string, string | null> = result.symbolOverrides || {};
        const newAddressOverrides: Record<string, string | null> = result.addressOverrides || {};
        
        console.log(`Loaded symbol overrides:`, newSymbolOverrides);
        console.log(`Loaded address overrides:`, newAddressOverrides);
        
        // Update props (parent component should handle this)
        symbolOverrides = newSymbolOverrides;
        addressOverrides = newAddressOverrides;
        
        dispatch('overridesChanged');
      } else {
        throw new Error(result.error || 'Failed to load overrides');
      }
    } catch (error) {
      console.error('Failed to load wallet overrides:', error);
    }
  }
  
  // Load overrides when component mounts
  onMount(() => {
    if (walletAddress) loadWalletOverrides();
  });
  
  // Reload overrides whenever walletAddress changes
  $: if (walletAddress) loadWalletOverrides();
  // Get unique symbols from available tokens only (not from override keys which might be contract addresses)
  $: uniqueSymbols = Array.from(
    new Set([
      ...availableTokens.map(t => t.symbol.toUpperCase())
    ])
  );
    // Get unique addresses from available tokens + any overridden addresses to keep excluded ones visible
  $: uniqueAddresses = Array.from(
    new Map<string, { address: string; symbol: string; chain: string }>([
      // existing tokens
      ...availableTokens.map(t => [
        `${t.contractAddress.toLowerCase()}-${t.chain}`,
        { address: t.contractAddress.toLowerCase(), symbol: t.symbol, chain: t.chain }
      ] as [string, { address: string; symbol: string; chain: string }]),
      // overridden addresses
      ...Object.keys(addressOverrides).map(addr => {
        const lower = addr.toLowerCase();
        const t = availableTokens.find(tok => tok.contractAddress.toLowerCase() === lower);
        return [
          `${lower}-${t?.chain || 'eth'}`,
          { address: lower, symbol: t?.symbol || '', chain: t?.chain || 'eth' }
        ] as [string, { address: string; symbol: string; chain: string }];
      })
    ]).values()
  );
  
  // Filter coin list based on search
  $: filteredCoinList = coinList.filter(coin =>
    searchQuery === '' ||
    coin.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle symbol override edit
  function startEditSymbol(symbol: string) {
    editingSymbol = symbol;
    editSymbolCgId = symbolOverrides[symbol] || '';
    searchQuery = '';
  }
  
  // Handle address override edit
  function startEditAddress(address: string) {
    editingAddress = address;
    editAddressCgId = addressOverrides[address] || '';
    searchQuery = '';
  }
  // Save symbol override
  async function saveSymbolOverride() {
    if (!editingSymbol) return;
    
    let symbol: string | null = null;
    
    if (editSymbolCgId === '__NONE__') {
      symbol = null; // Explicitly exclude
      console.log(`Setting symbol override for ${editingSymbol} to EXCLUDE (null)`);
    } else if (editSymbolCgId && editSymbolCgId.trim()) {
      symbol = editSymbolCgId.trim();
      console.log(`Setting symbol override for ${editingSymbol} to: ${symbol}`);
    }
      // Find the contract address for this symbol
    const token = availableTokens.find(t => t.symbol.toUpperCase() === editingSymbol);
    if (token) {
      console.log(`Found token for symbol ${editingSymbol}: contract=${token.contractAddress}, chain=${token.chain}`);
      const success = await saveOverrideToAPI('symbol', token.contractAddress, symbol, 'upsert', editingSymbol);
        if (success) {
        // Update local state - store by symbol, not contract address
        if (symbol === null) {
          symbolOverrides[editingSymbol] = null;
        } else {
          symbolOverrides[editingSymbol] = symbol;
        }
        symbolOverrides = { ...symbolOverrides }; // Trigger reactivity
        
        console.log(`Updated symbolOverrides:`, symbolOverrides);
        
        // Dispatch legacy event for backward compatibility
        dispatch('symbolOverride', { 
          contractAddress: token.contractAddress,
          symbol 
        });
        
        editingSymbol = null;
        editSymbolCgId = '';
      }
    } else {
      console.error(`No token found for symbol: ${editingSymbol}`);
    }
  }
    // Save address override
  async function saveAddressOverride() {
    if (!editingAddress) return;
    
    let coinGeckoId: string | null = null;
    
    if (editAddressCgId === '__NONE__') {
      coinGeckoId = null; // Explicitly exclude
      console.log(`Setting address override for ${editingAddress} to EXCLUDE (null)`);
    } else if (editAddressCgId && editAddressCgId.trim()) {
      coinGeckoId = editAddressCgId.trim();
      console.log(`Setting address override for ${editingAddress} to: ${coinGeckoId}`);
    }
    
    const success = await saveOverrideToAPI('address', editingAddress, coinGeckoId, 'upsert');
    
    if (success) {
      // Update local state
      if (coinGeckoId === null) {
        addressOverrides[editingAddress] = null;
      } else {
        addressOverrides[editingAddress] = coinGeckoId;
      }
      addressOverrides = { ...addressOverrides }; // Trigger reactivity
      
      console.log(`Updated addressOverrides:`, addressOverrides);
      
      // Dispatch legacy event for backward compatibility
      dispatch('addressOverride', { 
        contractAddress: editingAddress,
        coinGeckoId 
      });
      
      editingAddress = null;
      editAddressCgId = '';
    }
  }  // Remove override
  async function removeOverride(type: 'symbol' | 'address', key: string): Promise<boolean> {
    let contractAddress = '';
    
    if (type === 'symbol') {
      // For symbol overrides, we don't need to find the contract address from availableTokens
      // The API can handle symbol deletion by symbol name directly
      console.log(`Removing symbol override for ${key}`);
      contractAddress = ''; // Use empty string for symbol overrides
    } else {
      contractAddress = key;
      console.log(`Removing address override for ${contractAddress}`);
    }
    
    const success = await saveOverrideToAPI(type, contractAddress, null, 'delete', type === 'symbol' ? key : undefined);
    
    if (success) {
      // Update local state
      if (type === 'symbol') {
        // Fix: Delete by symbol key, not contract address
        delete symbolOverrides[key];
        symbolOverrides = { ...symbolOverrides }; // Trigger reactivity
        
        // Dispatch legacy event for backward compatibility
        dispatch('symbolOverride', { 
          contractAddress,
          symbol: null 
        });
      } else {
        delete addressOverrides[contractAddress];
        addressOverrides = { ...addressOverrides }; // Trigger reactivity
        
        // Dispatch legacy event for backward compatibility
        dispatch('addressOverride', { 
          contractAddress,
          coinGeckoId: null 
        });
      }
      return true;
    }
    return false;
  }
  
  // Cancel editing
  function cancelEdit() {
    editingSymbol = null;
    editingAddress = null;
    editSymbolCgId = '';
    editAddressCgId = '';
    searchQuery = '';
  }

  // Reset all symbol overrides
  async function resetAllSymbolOverrides() {
    if (!confirm('Are you sure you want to reset all symbol overrides? This action cannot be undone.')) {
      return;
    }

    const symbolsToReset = Object.keys(symbolOverrides);
    let successCount = 0;

    for (const symbol of symbolsToReset) {
      const success = await removeOverride('symbol', symbol);
      if (success) successCount++;
    }

    if (successCount === symbolsToReset.length) {
      console.log(`Successfully reset ${successCount} symbol overrides`);
      dispatch('overridesChanged');
    } else {
      console.warn(`Only ${successCount}/${symbolsToReset.length} symbol overrides were reset`);
    }
  }

  // Reset all address overrides
  async function resetAllAddressOverrides() {
    if (!confirm('Are you sure you want to reset all address overrides? This action cannot be undone.')) {
      return;
    }

    const addressesToReset = Object.keys(addressOverrides);
    let successCount = 0;

    for (const address of addressesToReset) {
      const success = await removeOverride('address', address);
      if (success) successCount++;
    }

    if (successCount === addressesToReset.length) {
      console.log(`Successfully reset ${successCount} address overrides`);
      dispatch('overridesChanged');
    } else {
      console.warn(`Only ${successCount}/${addressesToReset.length} address overrides were reset`);
    }
  }
  
  // Select coin from list
  function selectCoin(coinId: string) {
    if (editingSymbol) {
      editSymbolCgId = coinId;
    } else if (editingAddress) {
      editAddressCgId = coinId;
    }
    searchQuery = '';
  }
  // Sort symbols: active overrides first, then no overrides, then excluded (null) last
  $: sortedSymbols = uniqueSymbols.slice().sort((a, b) => {
    const aHasOverride = symbolOverrides[a] !== undefined;
    const bHasOverride = symbolOverrides[b] !== undefined;
    const aExcluded = symbolOverrides[a] === null;
    const bExcluded = symbolOverrides[b] === null;
    
    // Active overrides (non-null) first
    const aActive = aHasOverride && !aExcluded;
    const bActive = bHasOverride && !bExcluded;
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    // Then excluded items go to bottom
    if (aExcluded && !bExcluded) return 1;
    if (!aExcluded && bExcluded) return -1;
    
    // Alphabetical within groups
    return a.localeCompare(b);
  });  // Sort addresses: active overrides first, then no overrides, then excluded (null) last
  $: sortedAddresses = uniqueAddresses.slice().sort((a, b) => {
    const aHasOverride = addressOverrides[a.address] !== undefined;
    const bHasOverride = addressOverrides[b.address] !== undefined;
    const aExcluded = addressOverrides[a.address] === null;
    const bExcluded = addressOverrides[b.address] === null;
    
    // Active overrides (non-null) first
    const aActive = aHasOverride && !aExcluded;
    const bActive = bHasOverride && !bExcluded;
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    // Then excluded items go to bottom
    if (aExcluded && !bExcluded) return 1;
    if (!aExcluded && bExcluded) return -1;
    
    // Alphabetical within groups
    return a.symbol.localeCompare(b.symbol);
  });
</script>

<div class="override-manager mt-8">
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚙️</span>
          <h3 class="text-xl font-bold text-white">Token & Address Overrides</h3>
        </div>
        <div class="flex bg-white/20 rounded-lg p-1">
          <button
            type="button"
            on:click={() => activeTab = 'symbols'}
            class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeTab === 'symbols' ? 'bg-white text-purple-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}"
          >
            🏷️ Symbols
          </button>
          <button
            type="button"
            on:click={() => activeTab = 'addresses'}
            class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {activeTab === 'addresses' ? 'bg-white text-purple-600 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/10'}"
          >
            📍 Addresses
          </button>
        </div>
      </div>
    </div>    {#if activeTab === 'symbols'}
    <div class="p-6">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏷️</span>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Symbol Overrides</h4>
          </div>
          <button
            type="button"
            on:click={resetAllSymbolOverrides}
            class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-1"
            disabled={Object.keys(symbolOverrides).length === 0}
          >
            🗑️ Reset All Symbols
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Override CoinGecko IDs for specific token symbols to ensure accurate price matching.
        </p>
      </div><div class="space-y-3 max-h-96 overflow-y-auto pr-2">
        {#each sortedSymbols as symbol (symbol)}
          {@const hasOverride = symbolOverrides[symbol] !== undefined}
          {@const overrideValue = symbolOverrides[symbol]}
          
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 transition-all duration-200 hover:shadow-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span class="text-blue-600 dark:text-blue-400 font-bold text-sm">{symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <span class="font-semibold text-gray-900 dark:text-white">{symbol}</span>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {#if hasOverride}
                      {#if overrideValue === null}
                        <span class="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          🚫 Excluded from pricing
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          ✅ → {overrideValue}
                        </span>
                      {/if}
                    {:else}
                      <span class="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                        🤖 Auto-detect
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  on:click={() => startEditSymbol(symbol)}
                  class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-1"
                  {disabled}
                >
                  ✏️ Edit
                </button>
                {#if hasOverride}                <button
                  type="button"
                  on:click={() => removeOverride('symbol', symbol)}
                  class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-1"
                  disabled={disabled || saving}
                >
                  {#if saving}
                    <span class="animate-spin">⟳</span>
                  {:else}
                    🗑️ Remove
                  {/if}
                </button>
                {/if}
              </div>
            </div>
          
          {#if editingSymbol === symbol}
            <div class="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    bind:value={searchQuery}
                    placeholder="🔍 Search coins..."
                    class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    bind:value={editSymbolCgId}
                    placeholder="Or type CoinGecko ID manually (e.g. bitcoin)"
                    class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />                </div>
                
                {#if searchQuery && filteredCoinList.length > 0}
                  <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                    <div class="p-3 bg-gray-100 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select from CoinGecko (showing {Math.min(filteredCoinList.length, 20)} of {filteredCoinList.length} results):
                      </span>
                    </div>
                    {#each filteredCoinList.slice(0, 20) as coin (coin.id)}
                      <button
                        type="button"
                        on:click={() => selectCoin(coin.id)}
                        class="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div class="flex items-center justify-between">
                          <div>
                            <span class="font-medium text-gray-900 dark:text-white">{coin.symbol.toUpperCase()}</span>
                            <span class="text-gray-600 dark:text-gray-400 ml-2">{coin.name}</span>
                          </div>
                          <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{coin.id}</span>
                        </div>
                      </button>
                    {/each}
                    {#if filteredCoinList.length > 20}
                      <div class="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600">
                        ...and {filteredCoinList.length - 20} more. Refine your search to see more.
                      </div>
                    {/if}
                  </div>
                {/if}
                
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    on:click={() => { editSymbolCgId = '__NONE__'; }}
                    class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    🚫 Exclude from pricing
                  </button>
                </div>
                
                <div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">                  <button
                    type="button"
                    on:click={saveSymbolOverride}
                    class="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    disabled={disabled || saving}
                  >
                    {#if saving}
                      <span class="animate-spin">⟳</span>
                      Saving...
                    {:else}
                      ✅ Save Override
                    {/if}
                  </button>
                  <button
                    type="button"
                    on:click={cancelEdit}
                    class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          {/if}
          </div>
        {/each}
      </div>
    </div>  {:else}    <div class="p-6">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">📍</span>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Address Overrides</h4>
          </div>
          <button
            type="button"
            on:click={resetAllAddressOverrides}
            class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-1"
            disabled={Object.keys(addressOverrides).length === 0}
          >
            🗑️ Reset All Addresses
          </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Override CoinGecko IDs for specific contract addresses when auto-detection fails.
        </p>
      </div><div class="space-y-3 max-h-96 overflow-y-auto pr-2">
        {#each sortedAddresses as addressInfo (`${addressInfo.address}-${addressInfo.chain}`)}
          {@const address = addressInfo.address}
          {@const symbol = addressInfo.symbol}
          {@const chain = addressInfo.chain}
          {@const hasOverride = addressOverrides[address] !== undefined}
          {@const overrideValue = addressOverrides[address]}
          
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 transition-all duration-200 hover:shadow-md">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span class="text-purple-600 dark:text-purple-400 text-xs font-bold">📍</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-sm text-gray-900 dark:text-white break-all">{address}</span>
                  </div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      {symbol}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                      {chain}
                    </span>
                  </div>                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {#if hasOverride}
                      {#if overrideValue === null}
                        <span class="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          🚫 Excluded from pricing
                        </span>
                      {:else}
                        <span class="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          ✅ → {overrideValue}
                        </span>
                      {/if}
                    {:else}
                      <span class="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                        🤖 Auto-detect
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                <button
                  type="button"
                  on:click={() => startEditAddress(address)}
                  class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-1"
                  {disabled}
                >
                  ✏️ Edit
                </button>                {#if hasOverride}
                  <button
                    type="button"
                    on:click={() => removeOverride('address', address)}
                    class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-1"
                    disabled={disabled || saving}
                  >
                    {#if saving}
                      <span class="animate-spin">⟳</span>
                    {:else}
                      🗑️ Remove
                    {/if}
                  </button>
                {/if}
              </div>
            </div>
          
          {#if editingAddress === address}
            <div class="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    bind:value={searchQuery}
                    placeholder="🔍 Search coins..."
                    class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    bind:value={editAddressCgId}
                    placeholder="Or type CoinGecko ID manually (e.g. bitcoin)"
                    class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />                </div>
                
                {#if searchQuery && filteredCoinList.length > 0}
                  <div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                    <div class="p-3 bg-gray-100 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select from CoinGecko (showing {Math.min(filteredCoinList.length, 20)} of {filteredCoinList.length} results):
                      </span>
                    </div>
                    {#each filteredCoinList.slice(0, 20) as coin (coin.id)}
                      <button
                        type="button"
                        on:click={() => selectCoin(coin.id)}
                        class="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div class="flex items-center justify-between">
                          <div>
                            <span class="font-medium text-gray-900 dark:text-white">{coin.symbol.toUpperCase()}</span>
                            <span class="text-gray-600 dark:text-gray-400 ml-2">{coin.name}</span>
                          </div>
                          <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">{coin.id}</span>
                        </div>
                      </button>
                    {/each}
                    {#if filteredCoinList.length > 20}
                      <div class="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600">
                        ...and {filteredCoinList.length - 20} more. Refine your search to see more.
                      </div>
                    {/if}                  </div>
                {/if}
                
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    on:click={() => { editAddressCgId = '__NONE__'; }}
                    class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    🚫 Exclude from pricing
                  </button>
                </div>
                
                <div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600"><button
                    type="button"
                    on:click={saveAddressOverride}
                    class="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    disabled={disabled || saving}
                  >
                    {#if saving}
                      <span class="animate-spin">⟳</span>
                      Saving...
                    {:else}
                      ✅ Save Override
                    {/if}
                  </button>
                  <button
                    type="button"
                    on:click={cancelEdit}
                    class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Cancel
                  </button>
                </div>              </div>
            </div>
          {/if}
          </div>
        {/each}
      </div>
    </div>  {/if}
  </div>
</div>