<!-- WalletSettingsModal.svelte - Modal overlay for wallet settings -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import OverrideManager from './OverrideManager.svelte';
  import type { WalletData, CoinListEntry } from '$lib/components/types';

  export let wallet: WalletData;
  export let coinList: CoinListEntry[] = [];
  export let show = false;

  const dispatch = createEventDispatcher<{
    close: void;
    symbolOverride: { contractAddress: string; symbol: string | null };
    addressOverride: { contractAddress: string; coinGeckoId: string | null };
    updateWallet: WalletData;
  }>();

  let activeTab: 'overrides' | 'debug' = 'overrides';

  function closeModal() {
    dispatch('close');
  }

  function handleOutsideClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleSymbolOverride(event: CustomEvent<{ contractAddress: string; symbol: string | null }>) {
    dispatch('symbolOverride', event.detail);
  }

  function handleAddressOverride(event: CustomEvent<{ contractAddress: string; coinGeckoId: string | null }>) {
    dispatch('addressOverride', event.detail);
  }

  function updateLabel(newLabel: string) {
    const trimmedLabel = newLabel.trim();
    const updatedWallet: WalletData = {
      ...wallet,
      ...(trimmedLabel ? { label: trimmedLabel } : {})
    };
    dispatch('updateWallet', updatedWallet);
  }

  // Close modal on Escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    transition:fade={{ duration: 200 }}
    on:click={handleOutsideClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      transition:scale={{ duration: 200, start: 0.95 }}
      on:click|stopPropagation
    >
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 id="modal-title" class="text-xl font-semibold">
              Wallet Settings
            </h2>
            <p class="text-blue-100 text-sm mt-1">
              {wallet.label || `Wallet ${wallet.address.slice(0, 8)}...`}
            </p>
          </div>
          <button 
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            on:click={closeModal}
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 bg-gray-50">
        <div class="px-6 py-3">
          <div class="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2"
              class:bg-blue-600={activeTab === 'overrides'}
              class:text-white={activeTab === 'overrides'}
              class:text-gray-600={activeTab !== 'overrides'}
              class:hover:bg-gray-100={activeTab !== 'overrides'}
              on:click={() => activeTab = 'overrides'}
            >
              <span>⚙️</span>
              <span>Token Overrides</span>
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2"
              class:bg-blue-600={activeTab === 'debug'}
              class:text-white={activeTab === 'debug'}
              class:text-gray-600={activeTab !== 'debug'}
              class:hover:bg-gray-100={activeTab !== 'debug'}
              on:click={() => activeTab = 'debug'}
            >
              <span>🔍</span>
              <span>Debug & Info</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {#if activeTab === 'overrides'}
          <!-- Token Override Management -->
          <div class="space-y-6">
            <!-- Wallet Label Editor -->
            <div class="bg-gray-50 rounded-lg p-4">
              <label for="wallet-label" class="block text-sm font-medium text-gray-700 mb-2">
                Wallet Label
              </label>
              <input
                id="wallet-label"
                type="text"
                value={wallet.label || ''}
                placeholder="Enter wallet name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                on:blur={(e) => updateLabel(e.currentTarget.value)}
                on:keydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            </div>

            <!-- Override Manager -->
            {#if wallet.portfolio.length > 0}
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-800">Token Overrides</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    Customize how tokens are displayed and priced for this wallet
                  </p>
                </div>
                <div class="p-4">
                  <OverrideManager 
                    {coinList}
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
                </div>
              </div>
            {:else}
              <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                <div class="text-4xl mb-4">📝</div>
                <div class="text-lg font-medium mb-2">No Tokens Loaded</div>
                <div class="text-sm">Load wallet tokens first to configure overrides</div>
              </div>
            {/if}
          </div>

        {:else if activeTab === 'debug'}
          <!-- Debug and JSON Data -->
          <div class="space-y-6">
            
            <!-- Wallet Information -->
            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Wallet Information</span>
                </h3>
              </div>
              <div class="p-4">
                <pre class="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border overflow-x-auto font-mono">{JSON.stringify({
                  id: wallet.id,
                  address: wallet.address,
                  label: wallet.label,
                  balancesLoaded: wallet.balancesLoaded,
                  loadingBalances: wallet.loadingBalances,
                  portfolioTokens: wallet.portfolio.length,
                  rawTokens: wallet.rawOnchain.length,
                  lastUpdated: wallet.lastUpdated,
                  error: wallet.error
                }, null, 2)}</pre>
              </div>
            </div>

            <!-- Portfolio Data -->
            {#if wallet.portfolio.length > 0}
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span>💰</span>
                    <span>Portfolio Data</span>
                  </h3>
                </div>
                <div class="p-4">
                  <pre class="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border overflow-x-auto font-mono max-h-60">{JSON.stringify(wallet.portfolio, null, 2)}</pre>
                </div>
              </div>
            {/if}

            <!-- Override Data -->
            {#if Object.keys(wallet.addressOverrides || {}).length > 0 || Object.keys(wallet.symbolOverrides || {}).length > 0}
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span>⚙️</span>
                    <span>Active Overrides</span>
                  </h3>
                </div>
                <div class="p-4">
                  <pre class="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border overflow-x-auto font-mono">{JSON.stringify({
                    addressOverrides: wallet.addressOverrides || {},
                    symbolOverrides: wallet.symbolOverrides || {}
                  }, null, 2)}</pre>
                </div>
              </div>
            {/if}

            <!-- Raw On-chain Data -->
            {#if wallet.rawOnchain.length > 0}
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span>🔗</span>
                    <span>Raw On-chain Data</span>
                  </h3>
                </div>
                <div class="p-4">
                  <pre class="text-xs text-gray-600 bg-gray-50 p-4 rounded-lg border overflow-x-auto font-mono max-h-60">{JSON.stringify(wallet.rawOnchain, null, 2)}</pre>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div class="flex justify-end">
          <button
            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            on:click={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
