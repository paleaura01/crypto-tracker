<script lang="ts">  import { createEventDispatcher } from 'svelte';
  import { formatCurrency, formatPercentage } from '../../utils/formatters.js';
  import type { PortfolioItem } from '../types.js';
  
  export let portfolio: PortfolioItem[] = [];
  export let loading: boolean = false;
  export let error: string = '';
  export let showValues: boolean = true;
  export let sortBy: 'value' | 'balance' | 'symbol' = 'value';
  export let sortDirection: 'asc' | 'desc' = 'desc';
  
  const dispatch = createEventDispatcher<{
    refresh: void;
    tokenClick: { token: PortfolioItem };
    sortChange: { sortBy: string; direction: string };
  }>();
  
  let filteredPortfolio: PortfolioItem[] = [];
  let totalValue = 0;
  let searchQuery = '';
  
  // Calculate portfolio metrics
  $: {
    filteredPortfolio = portfolio
      .filter(item => 
        searchQuery === '' || 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'value':
            comparison = a.value - b.value;
            break;
          case 'balance':
            comparison = a.balance - b.balance;
            break;
          case 'symbol':
            comparison = a.symbol.localeCompare(b.symbol);
            break;
          default:
            comparison = 0;
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    
    totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);
  }
  // Toggle sort direction
  function toggleSortDirection() {
    sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    applySorting();
    dispatch('sortChange', { sortBy, direction: sortDirection });
  }

  // Apply sorting when select changes
  function applySorting() {
    // The reactive statement will handle the actual sorting
  }
  
  // Handle token click
  function handleTokenClick(token: PortfolioItem) {
    dispatch('tokenClick', { token });
  }
  
  // Handle refresh
  function handleRefresh() {
    dispatch('refresh');
  }
  
  // Get percentage of total portfolio
  function getPortfolioPercentage(value: number): number {
    return totalValue > 0 ? (value / totalValue) * 100 : 0;
  }
  
  // Get color for percentage bar
  function getPercentageColor(percentage: number): string {
    if (percentage > 20) return '#10b981'; // Green
    if (percentage > 10) return '#f59e0b'; // Yellow
    if (percentage > 5) return '#f97316';  // Orange
    return '#6b7280'; // Gray
  }
</script>

<div class="portfolio-display">
  <div class="portfolio-header">
    <div class="header-content">
      <h2 class="portfolio-title">Portfolio Balance</h2>
      {#if showValues && totalValue > 0}
        <div class="total-value">
          {formatCurrency(totalValue)}
        </div>
      {/if}
    </div>
    
    <div class="header-actions">
      <button
        type="button"
        on:click={handleRefresh}
        class="refresh-button"
        disabled={loading}
        title="Refresh portfolio data"
      >
        <span class="refresh-icon" class:spinning={loading}>🔄</span>
        Refresh
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="error-banner" role="alert">
      <span class="error-icon">⚠️</span>
      {error}
    </div>
  {/if}
  
  {#if portfolio.length > 0}    <div class="portfolio-controls">
      <div class="search-container">
        <label for="token-search" class="sr-only">Search tokens</label>
        <input
          id="token-search"
          type="text"
          bind:value={searchQuery}
          placeholder="Search tokens..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
        <div class="sort-controls">
        <label for="sort-select" class="sort-label">Sort by:</label>
        <select id="sort-select" bind:value={sortBy} on:change={applySorting} class="sort-select">
          <option value="value">Value</option>
          <option value="balance">Balance</option>
          <option value="symbol">Symbol</option>
        </select>
        <button
          type="button"
          on:click={toggleSortDirection}
          class="sort-direction-button"
          title="Toggle sort direction"
        >
          <span class="sort-arrow">{sortDirection === 'desc' ? '↓' : '↑'}</span>
        </button>
      </div>
    </div>
    
    <div class="token-list">
      {#each filteredPortfolio as token (token.symbol)}
        {@const percentage = getPortfolioPercentage(token.value)}
        <div
          class="token-row"
          on:click={() => handleTokenClick(token)}
          on:keydown={(e) => e.key === 'Enter' && handleTokenClick(token)}
          role="button"
          tabindex="0"
        >
          <div class="token-info">
            <div class="token-symbol">{token.symbol}</div>
            {#if token.name && token.name !== token.symbol}
              <div class="token-name">{token.name}</div>
            {:else if token.contractAddress}
              <div class="token-name">{token.contractAddress.slice(0, 8)}...</div>
            {/if}
          </div>
          
          <div class="token-balance">
            <div class="balance-amount">
              {token.balance.toLocaleString(undefined, { 
                minimumFractionDigits: 0,
                maximumFractionDigits: 6 
              })}
            </div>
            <div class="balance-symbol">{token.symbol}</div>
          </div>
          
          {#if showValues}
            <div class="token-price">
              {formatCurrency(token.price)}
            </div>
            
            <div class="token-value">
              <div class="value-amount">
                {formatCurrency(token.value)}
              </div>
              <div class="value-percentage">
                {formatPercentage(percentage)}
              </div>
            </div>
            
            <div class="portfolio-weight">
              <div 
                class="weight-bar"
                style="width: {Math.max(percentage, 1)}%; background-color: {getPercentageColor(percentage)}"
              ></div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    {#if filteredPortfolio.length === 0 && searchQuery}
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <div class="no-results-text">
          No tokens found matching "{searchQuery}"
        </div>
      </div>
    {/if}
    
  {:else if !loading}
    <div class="empty-portfolio">
      <span class="empty-icon">💼</span>
      <div class="empty-text">
        No tokens found in this wallet
      </div>
      <div class="empty-subtext">
        Enter a wallet address to view the portfolio
      </div>
    </div>
  {/if}
  
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading portfolio data...</div>
    </div>
  {/if}
</div>

<style>
  .portfolio-display {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .portfolio-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .portfolio-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .total-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #059669;
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .refresh-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .refresh-button:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .refresh-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .refresh-icon {
    transition: transform 0.3s ease;
  }
  
  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #dc2626;
    font-weight: 500;
  }
  
  .portfolio-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    gap: 1rem;
  }
  
  .search-container {
    position: relative;
    flex: 1;
    max-width: 300px;
  }
  
  .search-input {
    width: 100%;
    padding: 0.5rem 2.5rem 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }
  
  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .sort-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
  }
  
  .sort-select {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    font-size: 0.875rem;
    color: #374151;
    min-width: 120px;
  }
    .sort-select:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
    border-color: #3b82f6;
  }
  
  .sort-direction-button {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    color: #374151;
    font-size: 1rem;
    transition: background-color 0.2s;
    margin-left: 0.5rem;
  }
  
  .sort-direction-button:hover {
    background-color: #f3f4f6;
  }
    .sort-direction-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
    border-color: #3b82f6;
  }
  
  .sort-arrow {
    font-weight: bold;
  }
  
  .token-list {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .token-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1.5fr 100px;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background-color 0.15s ease;
    align-items: center;
  }
  
  .token-row:hover {
    background: #f9fafb;
  }
  
  .token-row:last-child {
    border-bottom: none;
  }
  
  .token-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .token-symbol {
    font-weight: 600;
    color: #111827;
    font-size: 0.875rem;
  }
  
  .token-name {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .token-balance {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    text-align: right;
  }
  
  .balance-amount {
    font-weight: 500;
    color: #111827;
    font-size: 0.875rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
  
  .balance-symbol {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .token-price {
    text-align: right;
    font-weight: 500;
    color: #111827;
    font-size: 0.875rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
  
  .token-value {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    text-align: right;
  }
  
  .value-amount {
    font-weight: 600;
    color: #059669;
    font-size: 0.875rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
  
  .value-percentage {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .portfolio-weight {
    position: relative;
    height: 4px;
    background: #f3f4f6;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .weight-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    gap: 1rem;
  }
  
  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .empty-portfolio,
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    gap: 1rem;
  }
  
  .empty-icon,
  .no-results-icon {
    font-size: 3rem;
    opacity: 0.5;
  }
  
  .empty-text,
  .no-results-text {
    font-size: 1.125rem;
    font-weight: 500;
    color: #6b7280;
  }
  
  .empty-subtext {
    font-size: 0.875rem;
    color: #9ca3af;
  }
  
  /* Accessibility utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  @media (max-width: 768px) {
    .portfolio-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .portfolio-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .search-container {
      max-width: none;
    }
    
    .sort-controls {
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .token-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: left;
    }
    
    .token-balance,
    .token-price,
    .token-value {
      text-align: left;
    }
    
    .portfolio-weight {
      margin-top: 0.5rem;
    }
  }
</style>
