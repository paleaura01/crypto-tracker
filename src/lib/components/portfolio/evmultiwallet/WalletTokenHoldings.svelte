<!-- WalletTokenHoldings.svelte - Token holdings display for individual wallet -->
<script lang="ts">
  import type { WalletData, GlobalPriceResp } from '$lib/components/types';

  export let wallet: WalletData;
  export let globalPriceResponse: GlobalPriceResp | null;
  export let accentColor: string;
  $: sortedPortfolio = wallet.portfolio
    .filter(item => item.balance > 0)
    .sort((a, b) => b.value - a.value);

  $: totalValue = sortedPortfolio
    .filter(item => !item.isOverrideExcluded)
    .reduce((sum, item) => sum + item.value, 0);
  $: pricesLoaded = globalPriceResponse && typeof globalPriceResponse === 'object' && !('error' in globalPriceResponse);

  function formatBalance(balance: number): string {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(2) + 'M';
    } else if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + 'K';
    } else if (balance >= 1) {
      return balance.toFixed(4);
    } else {
      return balance.toFixed(8);
    }
  }

  function formatValue(value: number): string {
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }

  function getChainIcon(chain: string): string {
    switch (chain) {
      case 'eth': return '⟠';
      case 'polygon': return '⬟';
      case 'bsc': return '🟡';
      default: return '⚪';
    }
  }

  function getChainName(chain: string): string {
    switch (chain) {
      case 'eth': return 'Ethereum';
      case 'polygon': return 'Polygon';
      case 'bsc': return 'BSC';
      default: return chain.toUpperCase();
    }
  }
</script>

<div class="border-t border-gray-100">
  
  <!-- Holdings Header -->
  <div class="p-4 bg-gray-50 border-b border-gray-100">
    <div class="flex items-center justify-between">
      <h4 class="font-semibold text-gray-900 flex items-center gap-2">
        <span class="text-lg">💎</span>
        Token Holdings
      </h4>
      <div class="text-right">
        <div class="text-lg font-bold text-gray-900">
          {formatValue(totalValue)}
        </div>        <div class="text-xs text-gray-500">
          {sortedPortfolio.filter(t => !t.isOverrideExcluded).length} priced
          {#if sortedPortfolio.filter(t => t.hasActiveOverride && !t.isOverrideExcluded).length > 0}
            • <span class="text-orange-600">{sortedPortfolio.filter(t => t.hasActiveOverride && !t.isOverrideExcluded).length} override</span>
          {/if}
          {#if sortedPortfolio.filter(t => t.isOverrideExcluded).length > 0}
            • <span class="text-red-500">{sortedPortfolio.filter(t => t.isOverrideExcluded).length} excluded</span>
          {/if}
          • {[...new Set(sortedPortfolio.map(t => t.chain))].length} chains
        </div>
      </div>
    </div>

    <!-- Price status indicator -->
    <div class="mt-2 flex items-center gap-2 text-xs">
      {#if pricesLoaded}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Prices loaded
        </span>
      {:else}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
          <span class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          Prices not loaded
        </span>
      {/if}
    </div>
  </div>  <!-- Token List -->
  <div class="max-h-80 overflow-y-auto">
    {#each sortedPortfolio as token, index (`${wallet.id}-${token.contractAddress || token.symbol}-${index}`)}
      <div class="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
        <div class="flex items-center justify-between">
          
          <!-- Token Info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            
            <!-- Chain indicator -->
            <div class="flex-shrink-0">
              <span 
                class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm bg-gradient-to-r {accentColor} text-white"
                title={getChainName(token.chain || '')}
              >
                {getChainIcon(token.chain || '')}
              </span>
            </div>            <!-- Token details -->
            <div class="flex-1 min-w-0">              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-900 truncate">
                  {token.symbol}
                </span>
                {#if token.isOverrideExcluded}
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    <span class="w-1 h-1 bg-red-500 rounded-full"></span>
                    EXCLUDED
                  </span>
                {:else if token.hasActiveOverride}
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                    <span class="w-1 h-1 bg-orange-500 rounded-full"></span>
                    OVERRIDE
                  </span>
                {:else if token.coinGeckoId}
                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
                    CG
                  </span>
                {/if}
              </div>
                <div class="text-sm text-gray-500 truncate">
                {formatBalance(token.balance)} {token.symbol}
                {#if token.isOverrideExcluded}
                  <span class="text-red-500 ml-1">(Excluded via {token.overrideType} override)</span>
                {:else if token.hasActiveOverride}
                  <span class="text-orange-600 ml-1">(Pricing via {token.overrideType} override)</span>
                {/if}
              </div>
              
              {#if token.contractAddress}
                <div class="text-xs text-gray-400 truncate font-mono">
                  {token.contractAddress}
                </div>
              {/if}
            </div>
          </div>          <!-- Value info -->
          <div class="text-right flex-shrink-0 ml-4">
            {#if token.isOverrideExcluded}
              <div class="text-red-500">
                <div class="font-medium">Excluded</div>
                <div class="text-xs">Not priced</div>
              </div>
            {:else if token.price > 0}
              <div class="font-semibold text-gray-900">
                {formatValue(token.value)}
              </div>
              <div class="text-sm text-gray-500">
                ${token.price.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 6 
                })}
              </div>
            {:else}
              <div class="text-gray-400">
                <div class="font-medium">No price</div>
                <div class="text-xs">Price not found</div>
              </div>
            {/if}
          </div>
        </div>        <!-- Progress bar for value representation -->
        {#if !token.isOverrideExcluded && token.value > 0 && totalValue > 0}
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                class="bg-gradient-to-r {accentColor} h-1.5 rounded-full transition-all duration-300"
                style="width: {Math.max(2, (token.value / totalValue) * 100)}%"
              ></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {((token.value / totalValue) * 100).toFixed(1)}% of wallet
            </div>
          </div>
        {/if}
      </div>
    {/each}

    <!-- Empty state -->
    {#if sortedPortfolio.length === 0}
      <div class="p-6 text-center space-y-3">
        <div class="text-4xl">📊</div>
        <div class="text-gray-600 font-medium">No tokens with balance</div>
        <div class="text-sm text-gray-500">All tokens in this wallet have zero balance</div>
      </div>
    {/if}
  </div>
  <!-- Holdings Footer -->
  {#if sortedPortfolio.length > 0}
    <div class="p-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
      <div class="flex items-center justify-between">
        <span>
          Last updated: {wallet.lastUpdated ? new Date(wallet.lastUpdated).toLocaleTimeString() : 'Never'}
        </span>        <div class="flex items-center gap-4">
          <span>
            {sortedPortfolio.filter(t => !t.isOverrideExcluded && t.price > 0).length}/{sortedPortfolio.filter(t => !t.isOverrideExcluded).length} tokens priced
          </span>
          {#if sortedPortfolio.filter(t => t.hasActiveOverride && !t.isOverrideExcluded).length > 0}
            <span class="text-orange-600">
              {sortedPortfolio.filter(t => t.hasActiveOverride && !t.isOverrideExcluded).length} with overrides
            </span>
          {/if}
          {#if sortedPortfolio.filter(t => t.isOverrideExcluded).length > 0}
            <span class="text-red-500">
              {sortedPortfolio.filter(t => t.isOverrideExcluded).length} excluded
            </span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for token list */
  .max-h-80::-webkit-scrollbar {
    width: 6px;
  }
  
  .max-h-80::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .max-h-80::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .max-h-80::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
