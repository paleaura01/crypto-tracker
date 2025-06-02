<!-- WalletSection.svelte - Individual wallet management card -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import AddressInput from '$lib/components/shared/AddressInput.svelte';
  import WalletTokenHoldings from './WalletTokenHoldings.svelte';
  import OverrideManager from './OverrideManager.svelte';
  import type { WalletData, GlobalPriceResp, CoinListEntry } from '$lib/components/types';
  export let wallet: WalletData;
  export let globalPriceResponse: GlobalPriceResp | null;
  export let walletIndex: number = 0;
  export let coinList: CoinListEntry[] = [];
  export let existingAddresses: string[] = [];

  const dispatch = createEventDispatcher<{
    updateWallet: WalletData;
    removeWallet: string;
    loadBalances: string;
    addressSubmit: { walletId: string; address: string };
    addressSave: { walletId: string; address: string; label?: string };
  }>();

  // Wallet accent colors for visual distinction
  const accentColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600', 
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-orange-500 to-orange-600',
    'from-teal-500 to-teal-600',
    'from-red-500 to-red-600'
  ];  $: accentColor = accentColors[walletIndex % accentColors.length] || 'from-blue-500 to-blue-600';
  $: portfolioValue = wallet.portfolio.reduce((sum, item) => sum + item.value, 0);
  $: hasTokens = wallet.portfolio.length > 0;
  // Create a completely isolated expansion state
  let localExpanded = false;
  let componentMounted = false;onMount(() => {
    // Initialize expansion state only once when component mounts
    localExpanded = wallet.expanded ?? false;
    componentMounted = true;
  });  // Use localExpanded for UI decisions
  let isExpanded = false;
  $: {
    const newIsExpanded = componentMounted ? localExpanded : false;
    isExpanded = newIsExpanded;
  }

  // Local state for wallet settings
  let showSettings = false;
  let activeSettingsTab: 'overrides' | 'debug' = 'overrides';

  function handleAddressSubmit(event: CustomEvent<{ address: string }>) {
    dispatch('addressSubmit', { 
      walletId: wallet.id, 
      address: event.detail.address 
    });
  }
  function handleAddressSave(event: CustomEvent<{ address: string; label?: string | undefined }>) {
    const detail = event.detail;
    dispatch('addressSave', { 
      walletId: wallet.id, 
      address: detail.address, 
      ...(detail.label ? { label: detail.label } : {})
    });
  }  function toggleExpanded() {
    if (!componentMounted) return;
    
    // Toggle local state
    localExpanded = !localExpanded;
    
    // Don't dispatch any updates to parent - keep expansion state purely local
  }  function loadBalances() {
    dispatch('loadBalances', wallet.id);
  }

  function removeWallet() {
    if (confirm(`Remove wallet ${wallet.label || wallet.address}?`)) {
      dispatch('removeWallet', wallet.id);
    }
  }  function updateLabel(newLabel: string) {
    const trimmedLabel = newLabel.trim();
    const updatedWallet: WalletData = {
      ...wallet,
      ...(trimmedLabel ? { label: trimmedLabel } : {})
    };
    dispatch('updateWallet', updatedWallet);
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }
  function handleSymbolOverride(event: CustomEvent<{ contractAddress: string; symbol: string | null }>) {
    const { contractAddress, symbol } = event.detail;
    const updatedOverrides = { ...(wallet.symbolOverrides || {}) };
    
    if (symbol) {
      updatedOverrides[contractAddress] = symbol;
    } else {
      delete updatedOverrides[contractAddress];
    }
    
    const updatedWallet = {
      ...wallet,
      symbolOverrides: updatedOverrides
    };
    dispatch('updateWallet', updatedWallet);
  }
  function handleAddressOverride(event: CustomEvent<{ contractAddress: string; coinGeckoId: string | null }>) {
    const { contractAddress, coinGeckoId } = event.detail;
    const updatedOverrides = { ...(wallet.addressOverrides || {}) };
    
    if (coinGeckoId) {
      updatedOverrides[contractAddress] = coinGeckoId;
    } else {
      delete updatedOverrides[contractAddress];
    }
    
    const updatedWallet = {
      ...wallet,
      addressOverrides: updatedOverrides
    };
    dispatch('updateWallet', updatedWallet);
  }
</script>

<!-- Wallet Card -->
<div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
  
  <!-- Wallet Header -->
  <div class="relative">
    <!-- Accent gradient bar -->
    <div class="h-1 bg-gradient-to-r {accentColor}"></div>
    
    <!-- Header content -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        
        <!-- Left: Wallet info and expand toggle -->
        <button 
          class="flex items-center gap-3 text-left flex-1 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200"
          on:click={toggleExpanded}
        >          <!-- Expand/collapse icon -->
          <div class="text-gray-400 transition-transform duration-200" 
               class:rotate-180={isExpanded}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </div>
          
          <!-- Wallet info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 truncate">
                {wallet.label || `Wallet ${walletIndex + 1}`}
              </h3>
              {#if wallet.balancesLoaded}
                <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {wallet.portfolio.length} tokens
                </span>
              {/if}
            </div>
            
            <div class="text-sm text-gray-500 truncate">
              {wallet.address || 'No address set'}
            </div>
            
            {#if hasTokens}
              <div class="text-lg font-bold text-gray-900 mt-1">
                ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            {/if}
          </div>
        </button>

        <!-- Right: Action buttons -->
        <div class="flex items-center gap-2 ml-4">
          
          <!-- Refresh button -->
          {#if wallet.address.trim()}
            <button 
              class="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r {accentColor} text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              class:animate-pulse={wallet.loadingBalances}
              on:click={loadBalances}
              disabled={wallet.loadingBalances}
              title={wallet.balancesLoaded ? 'Refresh Balances' : 'Load Balances'}
            >
              {#if wallet.loadingBalances}
                <span class="animate-spin">⟳</span>
              {:else}
                <span>🔄</span>
              {/if}
              <span class="hidden sm:inline">
                {wallet.balancesLoaded ? 'Refresh' : 'Load'}              </span>
            </button>
          {/if}
          
          <!-- Wallet Settings button -->
          <button 
            class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            class:text-blue-500={showSettings}
            class:bg-blue-50={showSettings}
            on:click={toggleSettings}
            title="Wallet Settings"
            aria-label="Toggle wallet settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          
          <!-- Remove wallet button -->
          <button 
            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
            on:click={removeWallet}
            title="Remove Wallet"
            aria-label="Remove wallet {wallet.label || wallet.address || 'unnamed'}"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Error display -->
      {#if wallet.error}
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-2 text-red-700 text-sm">
            <span>⚠️</span>
            <span>{wallet.error}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>  <!-- Expandable Content -->
  {#if isExpanded}
    <div transition:slide={{ duration: 300 }} class="border-t border-gray-100">
      
      <!-- Wallet Controls Section -->
      <div class="p-4 space-y-4 bg-gray-50">
          <!-- Wallet Label Input -->
        <div class="space-y-2">
          <label for="wallet-label-{wallet.id}" class="block text-sm font-medium text-gray-700">
            Wallet Label (Optional)
          </label>
          <input 
            id="wallet-label-{wallet.id}"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g. Main Wallet, DeFi Wallet, etc."
            value={wallet.label || ''}
            on:input={(e) => updateLabel(e.currentTarget.value)}
          />
        </div>

        <!-- Address Input -->
        <div class="space-y-2">
          <label for="wallet-address-{wallet.id}" class="block text-sm font-medium text-gray-700">
            Wallet Address
          </label>          <AddressInput 
            bind:address={wallet.address}
            loading={wallet.loadingBalances}
            error={wallet.error}
            placeholder="Enter EVM wallet address (0x...)"
            existingAddresses={existingAddresses}
            on:submit={handleAddressSubmit}
            on:save={handleAddressSave}
          />
        </div>
      </div>      <!-- Wallet Settings Panel -->
      {#if showSettings}
        <div transition:slide={{ duration: 300 }} class="border-t border-gray-100 bg-gray-50">
          <div class="p-4">
            <!-- Settings Header with Tabs -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  class:bg-blue-600={activeSettingsTab === 'overrides'}
                  class:text-white={activeSettingsTab === 'overrides'}
                  class:text-gray-600={activeSettingsTab !== 'overrides'}
                  class:hover:bg-gray-100={activeSettingsTab !== 'overrides'}
                  on:click={() => activeSettingsTab = 'overrides'}
                >
                  ⚙️ Overrides
                </button>
                <button
                  class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  class:bg-blue-600={activeSettingsTab === 'debug'}
                  class:text-white={activeSettingsTab === 'debug'}
                  class:text-gray-600={activeSettingsTab !== 'debug'}
                  class:hover:bg-gray-100={activeSettingsTab !== 'debug'}
                  on:click={() => activeSettingsTab = 'debug'}
                >
                  🔍 Debug/JSON
                </button>
              </div>
              <button 
                class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                on:click={() => showSettings = false}
              >
                ✕ Close
              </button>
            </div>
            
            <!-- Tab Content -->
            {#if activeSettingsTab === 'overrides'}
              <!-- Token Override Management -->
              {#if wallet.portfolio.length > 0}
                <OverrideManager 
                  coinList={coinList}
                  addressOverrides={wallet.addressOverrides || {}}
                  symbolOverrides={wallet.symbolOverrides || {}}
                  availableTokens={wallet.portfolio.map(token => ({
                    symbol: token.symbol,
                    contractAddress: token.contractAddress || '',
                    chain: token.chain || ''
                  }))}
                  disabled={false}
                  on:symbolOverride={handleSymbolOverride}
                  on:addressOverride={handleAddressOverride}
                />
              {:else}
                <div class="text-center py-6 text-gray-500">
                  <div class="text-2xl mb-2">📝</div>
                  <div class="text-sm">Load wallet tokens to configure overrides</div>
                </div>
              {/if}
              
            {:else if activeSettingsTab === 'debug'}
              <!-- Debug and JSON Data -->
              <div class="space-y-4">
                
                <!-- Wallet Info -->
                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div class="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h5 class="text-sm font-semibold text-gray-700">📋 Wallet Information</h5>
                  </div>
                  <div class="p-4">
                    <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify({
                      id: wallet.id,
                      address: wallet.address,
                      label: wallet.label,
                      balancesLoaded: wallet.balancesLoaded,
                      loadingBalances: wallet.loadingBalances,
                      lastUpdated: wallet.lastUpdated,
                      portfolioTokenCount: wallet.portfolio.length,
                      rawTokenCount: wallet.rawOnchain.length,
                      totalValue: wallet.portfolio.reduce((sum, item) => sum + item.value, 0)
                    }, null, 2)}</pre>
                  </div>
                </div>

                <!-- Raw On-chain Data -->
                {#if wallet.rawOnchain.length > 0}
                  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <h5 class="text-sm font-semibold text-gray-700">🔗 Raw On-chain Data ({wallet.rawOnchain.length} tokens)</h5>
                    </div>
                    <div class="p-4 max-h-64 overflow-y-auto">
                      <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify(wallet.rawOnchain, null, 2)}</pre>
                    </div>
                  </div>
                {/if}

                <!-- Computed Portfolio Data -->
                {#if wallet.portfolio.length > 0}
                  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <h5 class="text-sm font-semibold text-gray-700">💰 Computed Portfolio ({wallet.portfolio.length} tokens)</h5>
                    </div>
                    <div class="p-4 max-h-64 overflow-y-auto">
                      <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify(wallet.portfolio, null, 2)}</pre>
                    </div>
                  </div>
                {/if}                <!-- Price Data for this Wallet's Tokens -->
                {#if globalPriceResponse && wallet.portfolio.length > 0}
                  {@const walletTokenIds = wallet.portfolio.map(t => t.coinGeckoId).filter((id): id is string => typeof id === 'string' && id.length > 0)}
                  {@const walletPriceData = walletTokenIds.reduce((acc, id) => {
                    if (globalPriceResponse && typeof globalPriceResponse === 'object' && !('error' in globalPriceResponse) && id && globalPriceResponse[id]) {
                      acc[id] = globalPriceResponse[id];
                    }
                    return acc;
                  }, {} as Record<string, any>)}
                  
                  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <h5 class="text-sm font-semibold text-gray-700">💱 Price Data for Wallet Tokens</h5>
                    </div>
                    <div class="p-4 max-h-64 overflow-y-auto">
                      <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify(walletPriceData, null, 2)}</pre>
                    </div>
                  </div>
                {/if}

                <!-- Override Data -->
                {#if (wallet.addressOverrides && Object.keys(wallet.addressOverrides).length > 0) || (wallet.symbolOverrides && Object.keys(wallet.symbolOverrides).length > 0)}
                  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <h5 class="text-sm font-semibold text-gray-700">🔧 Active Overrides</h5>
                    </div>
                    <div class="p-4">
                      <pre class="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify({
                        addressOverrides: wallet.addressOverrides || {},
                        symbolOverrides: wallet.symbolOverrides || {}
                      }, null, 2)}</pre>
                    </div>
                  </div>
                {/if}
                
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Token Holdings Section -->
      {#if hasTokens}
        <WalletTokenHoldings 
          {wallet}
          {globalPriceResponse}
          {accentColor}
        />
      {:else if wallet.balancesLoaded}
        <!-- Empty state -->
        <div class="p-6 text-center space-y-3">
          <div class="text-4xl">📭</div>
          <div class="text-gray-600 font-medium">No tokens found</div>
          <div class="text-sm text-gray-500">This wallet doesn't have any tokens on supported chains</div>
        </div>
      {:else if wallet.address.trim()}
        <!-- Unloaded state -->
        <div class="p-6 text-center space-y-3">
          <div class="text-4xl">🔍</div>
          <div class="text-gray-600 font-medium">Ready to load balances</div>
          <div class="text-sm text-gray-500">Click the refresh button to load token balances for this wallet</div>
        </div>      {/if}    </div>
  {/if}
</div>

<style>
  /* Custom styles for wallet cards */
  .wallet-card {
    transition: all 0.3s ease;
  }
  
  .wallet-card:hover {
    transform: translateY(-2px);
  }
</style>
