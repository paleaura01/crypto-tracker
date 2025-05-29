<!-- Token List Component -->
<script lang="ts">
  import type { TokenBalance } from '../../types/index.js';
  import TokenBalanceDisplay from './TokenBalanceDisplay.svelte';
  import { formatCurrency } from '../../utils/formatters.js';

  export let tokens: TokenBalance[] = [];
  export let loading: boolean = false;
  export let error: string = '';
  export let onRefresh: (() => void) | undefined = undefined;

  $: totalValue = tokens.reduce((sum, token) => sum + token.value_usd, 0);
  $: hasTokens = tokens.length > 0;
  $: sortedTokens = tokens
    .filter(token => parseFloat(token.balance) > 0)
    .sort((a, b) => b.value_usd - a.value_usd);
</script>

<div class="token-list">
  <div class="token-list-header">
    <h3>Token Balances</h3>
    {#if hasTokens}
      <div class="total-value">
        Total: {formatCurrency(totalValue)}
      </div>
    {/if}
    {#if onRefresh}
      <button 
        class="refresh-btn" 
        class:loading 
        on:click={onRefresh}
        disabled={loading}
      >
        {loading ? '↻' : '⟳'} Refresh
      </button>
    {/if}
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading token balances...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <p class="error-message">{error}</p>
      {#if onRefresh}
        <button class="retry-btn" on:click={onRefresh}>
          Try Again
        </button>
      {/if}
    </div>
  {:else if hasTokens}
    <div class="token-grid">
      {#each sortedTokens as token (token.token_address + token.symbol)}
        <TokenBalanceDisplay balance={token} />
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>No tokens found</p>
      <span class="empty-subtitle">
        This wallet doesn't have any token balances or they haven't loaded yet.
      </span>
    </div>
  {/if}
</div>

<style>
  .token-list {
    width: 100%;
  }

  .token-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;
  }

  .token-list-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  }

  .total-value {
    font-size: 1rem;
    font-weight: 500;
    color: #059669;
  }

  .refresh-btn {
    padding: 6px 12px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #e5e7eb;
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-btn.loading {
    animation: spin 1s linear infinite;
  }

  .token-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  .error-message {
    color: #dc2626;
    margin-bottom: 16px;
    font-weight: 500;
  }

  .retry-btn {
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }

  .retry-btn:hover {
    background: #b91c1c;
  }

  .empty-subtitle {
    color: #6b7280;
    font-size: 0.875rem;
    margin-top: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
