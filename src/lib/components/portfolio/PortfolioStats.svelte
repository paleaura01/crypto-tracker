<!-- PortfolioStats.svelte - Summary statistics component -->
<script lang="ts">
  import { formatCurrency } from '../../utils/formatters.js';
  import type { PortfolioItem } from '../types.js';
  
  export let portfolio: PortfolioItem[] = [];
  export let loading: boolean = false;
  
  let totalValue = 0;
  let tokenCount = 0;
  let averageValue = 0;
  let topToken: PortfolioItem | null = null;
  
  // Calculate portfolio statistics
  $: {
    totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);
    tokenCount = portfolio.length;
    averageValue = tokenCount > 0 ? totalValue / tokenCount : 0;
    topToken = portfolio.length > 0 
      ? portfolio.reduce((max, item) => item.value > max.value ? item : max)
      : null;
  }
</script>

<div class="portfolio-stats">
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading portfolio statistics...</p>
    </div>
  {:else if portfolio.length > 0}
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Value</h3>
        <p class="stat-value">{formatCurrency(totalValue)}</p>
      </div>
      
      <div class="stat-card">
        <h3>Token Count</h3>
        <p class="stat-value">{tokenCount}</p>
      </div>
      
      <div class="stat-card">
        <h3>Average Value</h3>
        <p class="stat-value">{formatCurrency(averageValue)}</p>
      </div>
      
      {#if topToken}
        <div class="stat-card">
          <h3>Top Holding</h3>
          <p class="stat-value">{topToken.symbol}</p>
          <p class="stat-detail">{formatCurrency(topToken.value)}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p>No tokens to display statistics for.</p>
    </div>
  {/if}
</div>

<style>
  .portfolio-stats {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
  }

  .stat-card h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .stat-detail {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0.25rem 0 0 0;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
</style>
