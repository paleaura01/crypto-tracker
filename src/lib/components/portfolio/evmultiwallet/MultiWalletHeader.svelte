<!-- MultiWalletHeader.svelte - Global portfolio header and controls -->
<script lang="ts">  import { createEventDispatcher } from 'svelte';

  export let totalPortfolioValue: number;
  export let walletsCount: number;
  export let chainsCount: number;
  export let tokensCount: number;
  export let loadingPrices: boolean;
  export let pricesLoaded: boolean = false;
  const dispatch = createEventDispatcher<{
    addWallet: void;
    loadAllPrices: void;
  }>();

  function addWallet() {
    dispatch('addWallet');
  }
  function loadAllPrices() {
    dispatch('loadAllPrices');
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
</script>

<!-- Portfolio Header -->
<div class="text-center mb-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-4">
    <span class="text-5xl">💼</span>
    <span>Multi-Wallet Portfolio</span>
  </h1>
  
  <!-- Global Portfolio Stats -->
  {#if walletsCount > 0}
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
      
      <!-- Total Value Display -->
      <div class="text-center mb-6">
        <div class="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {formatCurrency(totalPortfolioValue)}
        </div>
        <div class="text-lg text-gray-600 mt-2">Total Portfolio Value</div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        <!-- Wallets Count -->
        <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <div class="text-2xl font-bold text-blue-700">{walletsCount}</div>
          <div class="text-sm text-blue-600 font-medium">
            {walletsCount === 1 ? 'Wallet' : 'Wallets'}
          </div>
        </div>

        <!-- Tokens Count -->
        <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <div class="text-2xl font-bold text-green-700">{tokensCount}</div>
          <div class="text-sm text-green-600 font-medium">
            {tokensCount === 1 ? 'Token' : 'Tokens'}
          </div>
        </div>

        <!-- Chains Count -->
        <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <div class="text-2xl font-bold text-purple-700">{chainsCount}</div>
          <div class="text-sm text-purple-600 font-medium">
            {chainsCount === 1 ? 'Chain' : 'Chains'}
          </div>
        </div>
      </div>

      <!-- Price Status -->
      <div class="flex justify-center mb-4">
        {#if pricesLoaded}
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <span>✓</span>
            Prices Loaded
          </span>
        {:else if loadingPrices}
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg animate-pulse">
            <span class="animate-spin">⟳</span>
            Loading Prices...
          </span>
        {:else}
          <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg">
            <span>💰</span>
            Prices Not Loaded
          </span>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Welcome State -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 mb-8">
      <div class="text-center space-y-6">
        <div class="text-8xl">🚀</div>
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-gray-900">Welcome to Multi-Wallet Tracking</h2>
          <p class="text-lg text-gray-600 max-w-md mx-auto">
            Track multiple EVM wallets in one beautiful dashboard. 
            Add your first wallet to get started!
          </p>
        </div>
        <div class="text-sm text-gray-500 space-y-1">
          <div>✨ Support for Ethereum, Polygon, and BSC</div>
          <div>📊 Real-time portfolio tracking</div>
          <div>🔧 Advanced override management</div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Global Action Bar -->
<div class="flex flex-wrap items-center justify-center gap-4 mb-8">
  
  <!-- Add Wallet Button -->
  <button 
    class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
    on:click={addWallet}
  >
    <span class="text-xl">➕</span>
    <span>Add Wallet</span>
  </button>

  <!-- Load All Prices Button -->
  {#if walletsCount > 0}
    <button 
      class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      class:animate-pulse={loadingPrices}
      on:click={loadAllPrices}
      disabled={loadingPrices}
    >
      {#if loadingPrices}
        <span class="animate-spin text-xl">⟳</span>
      {:else}
        <span class="text-xl">💰</span>
      {/if}
      <span>Load All Prices</span>    </button>
  {/if}
</div>

<style>
  /* Enhanced gradient text effect */
  .bg-clip-text {
    -webkit-background-clip: text;
    background-clip: text;
  }
  
  /* Button hover animations */
  button:hover {
    transform: translateY(-2px);
  }
  
  button:active {
    transform: translateY(0);
  }
</style>
