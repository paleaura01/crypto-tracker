<!-- AdvancedSettings.svelte - Unified advanced settings modal with debug info and overrides -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  
  import OverrideManager from './OverrideManager.svelte';
  import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
  
  import type { 
    DebugInfo, 
    CoinListEntry, 
    OverrideMap 
  } from '$lib/components/types';

  // Props
  export let show: boolean = false;
  export let coinList: CoinListEntry[] = [];
  export let addressOverrides: OverrideMap = {};
  export let symbolOverrides: OverrideMap = {};
  export let debugInfo: DebugInfo;
  export let coinListLoading: boolean = false;
  export let coinListError: string | null = null;
  export let balancesLoading: boolean = false;

  // Events
  const dispatch = createEventDispatcher<{
    close: void;
    updateGlobalAddressOverrides: OverrideMap;
    updateGlobalSymbolOverrides: OverrideMap;
    refreshCoinList: void;
    refreshBalances: void;
    clearDebugEvents: void;
    exportDebugData: void;
  }>();

  // Local state
  let activeTab: 'overrides' | 'debug' = 'overrides';
  // Event handlers
  function handleClose() {
    dispatch('close');
  }

  function handleBackdropClick(event: MouseEvent) {
    // Only close if the click is on the backdrop itself, not on child elements
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
  function handleOverrideEvents(event: CustomEvent) {
    switch (event.type) {
      case 'symbolOverride':
        const symbolDetail = event.detail as { contractAddress: string; symbol: string | null };
        const newSymbolOverrides = { ...symbolOverrides };
        if (symbolDetail.symbol === null) {
          delete newSymbolOverrides[symbolDetail.contractAddress];
        } else {
          newSymbolOverrides[symbolDetail.contractAddress] = symbolDetail.symbol;
        }
        dispatch('updateGlobalSymbolOverrides', newSymbolOverrides);
        break;
        
      case 'addressOverride':
        const addressDetail = event.detail as { contractAddress: string; coinGeckoId: string | null };
        const newAddressOverrides = { ...addressOverrides };
        if (addressDetail.coinGeckoId === null) {
          delete newAddressOverrides[addressDetail.contractAddress];
        } else {
          newAddressOverrides[addressDetail.contractAddress] = addressDetail.coinGeckoId;
        }
        dispatch('updateGlobalAddressOverrides', newAddressOverrides);
        break;
    }
  }

  function handleDebugEvents(event: CustomEvent) {
    switch (event.type) {
      case 'refreshCoinList':
        dispatch('refreshCoinList');
        break;
      case 'refreshBalances':
        dispatch('refreshBalances');
        break;
      case 'clearDebugEvents':
        dispatch('clearDebugEvents');
        break;
      case 'exportDebugData':
        dispatch('exportDebugData');
        break;
    }
  }

  // Close on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Enter' && handleClose()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="advanced-settings-title"
    tabindex="-1"
  ><!-- Modal Content -->
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      transition:slide={{ duration: 300 }}
      role="document"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚙️</span>
          <h2 id="advanced-settings-title" class="text-xl font-semibold text-gray-900">
            Advanced Settings
          </h2>
        </div>
        
        <!-- Tab Navigation -->
        <div class="flex items-center gap-2">
          <div class="flex bg-gray-100 rounded-lg p-1">
            <button
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 {activeTab === 'overrides' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
              on:click={() => activeTab = 'overrides'}
            >
              🔧 Token Overrides
            </button>
            
            {#if import.meta.env.DEV}
              <button
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 {activeTab === 'debug' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
                on:click={() => activeTab = 'debug'}
              >
                🐛 Debug Info
              </button>
            {/if}
          </div>
          
          <button 
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            on:click={handleClose}
            title="Close Advanced Settings"
            aria-label="Close advanced settings"
          >
            <span class="text-xl">×</span>
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 overflow-hidden">
        {#if activeTab === 'overrides'}
          <div class="p-6 h-full overflow-y-auto">
            <div class="mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Token Override Management</h3>
              <p class="text-sm text-gray-600">
                Manage symbol and address overrides to fix token identification issues across your wallets.
              </p>
            </div>
            
            <OverrideManager 
              {coinList}
              {addressOverrides}
              {symbolOverrides}
              on:updateGlobalAddressOverrides={handleOverrideEvents}
              on:updateGlobalSymbolOverrides={handleOverrideEvents}
            />
          </div>
          
        {:else if activeTab === 'debug' && import.meta.env.DEV}
          <div class="p-6 h-full overflow-y-auto">
            <div class="mb-4">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Debug Information</h3>
              <p class="text-sm text-gray-600">
                Development tools for monitoring component performance and troubleshooting issues.
              </p>
            </div>
            
            <DebugPanel 
              {debugInfo}
              {coinListLoading}
              {coinListError}
              {balancesLoading}
              on:refreshCoinList={handleDebugEvents}
              on:refreshBalances={handleDebugEvents}
              on:clearDebugEvents={handleDebugEvents}
              on:exportDebugData={handleDebugEvents}
            />
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div class="text-sm text-gray-500">
          {#if activeTab === 'overrides'}
            Override changes are automatically saved to local storage
          {:else if activeTab === 'debug'}
            Debug information updates in real-time during development
          {/if}
        </div>
        
        <button
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          on:click={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure modal appears above other content */
  :global(body:has(.fixed)) {
    overflow: hidden;
  }
</style>
