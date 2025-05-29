<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Define proper types for the debug data
  interface BalanceData {
    token_address: string;
    symbol: string;
    name?: string;
    logo?: string;
    thumbnail?: string;
    decimals: number;
    balance: string;
    possible_spam?: boolean;
    verified_contract?: boolean;
    [key: string]: unknown;
  }
  
  interface PriceResponseData {
    [symbol: string]: {
      usd?: number;
      usd_24h_change?: number;
      usd_24h_vol?: number;
      usd_market_cap?: number;
      [key: string]: unknown;
    };
  }
  
  interface CoinListItem {
    id: string;
    symbol: string;
    name: string;
    platforms?: Record<string, string>;
    [key: string]: unknown;
  }
  
  export let rawOnchain: BalanceData[] = [];
  export let priceResponse: PriceResponseData | null = null;
  export let coinList: CoinListItem[] = [];
  export let loading: boolean = false;
  export let coinListError: string | null = null;
  
  const dispatch = createEventDispatcher<{
    refreshBalances: void;
    refreshCoinList: void;
    exportData: { type: 'balances' | 'prices' | 'coinlist'; data: unknown };
  }>();
  
  let activeSection: 'balances' | 'prices' | 'coinlist' = 'balances';
  let jsonFormatted = true;
  
  // Handle refresh actions
  function handleRefreshBalances() {
    dispatch('refreshBalances');
  }
  
  function handleRefreshCoinList() {
    dispatch('refreshCoinList');
  }
    // Handle data export
  function handleExport(type: 'balances' | 'prices' | 'coinlist') {
    let data: unknown;
    let filename: string;
    
    switch (type) {
      case 'balances':
        data = rawOnchain;
        filename = 'wallet-balances.json';
        break;
      case 'prices':
        data = priceResponse;
        filename = 'price-response.json';
        break;
      case 'coinlist':
        data = coinList;
        filename = 'coingecko-list.json';
        break;
    }
    
    dispatch('exportData', { type, data });
    
    // Download the data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
    // Format JSON for display
  function formatJson(data: unknown): string {
    if (!data) return 'null';
    
    try {
      return jsonFormatted 
        ? JSON.stringify(data, null, 2) 
        : JSON.stringify(data);
    } catch (error) {
      return 'Error formatting JSON: ' + error;
    }
  }
    // Get data size
  function getDataSize(data: unknown): string {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
</script>

<div class="raw-data-viewer">
  <div class="viewer-header">
    <h3 class="viewer-title">Raw Data Inspector</h3>
    <div class="format-controls">
      <label class="format-toggle">
        <input
          type="checkbox"
          bind:checked={jsonFormatted}
        />
        <span>Formatted JSON</span>
      </label>
    </div>
  </div>
  
  <div class="section-tabs">
    <button
      type="button"
      on:click={() => activeSection = 'balances'}
      class="tab-button"
      class:active={activeSection === 'balances'}
    >
      <span class="tab-label">On-Chain Balances</span>
      <span class="tab-count">({rawOnchain.length})</span>
    </button>
    <button
      type="button"
      on:click={() => activeSection = 'prices'}
      class="tab-button"
      class:active={activeSection === 'prices'}
    >
      <span class="tab-label">Price Response</span>
      <span class="tab-size">({getDataSize(priceResponse)})</span>
    </button>
    <button
      type="button"
      on:click={() => activeSection = 'coinlist'}
      class="tab-button"
      class:active={activeSection === 'coinlist'}
    >
      <span class="tab-label">CoinGecko List</span>
      <span class="tab-count">({coinList.length})</span>
    </button>
  </div>
  
  <div class="data-section">
    {#if activeSection === 'balances'}
      <div class="section-header">
        <div class="section-info">
          <h4>On-Chain Balance Data</h4>
          <p class="section-meta">
            {rawOnchain.length} tokens • {getDataSize(rawOnchain)}
          </p>
        </div>
        <div class="section-actions">
          <button
            type="button"
            on:click={handleRefreshBalances}
            class="action-button refresh"
            disabled={loading}
          >
            <span class="action-icon" class:spinning={loading}>🔄</span>
            Refresh Balances
          </button>
          <button
            type="button"
            on:click={() => handleExport('balances')}
            class="action-button export"
            disabled={rawOnchain.length === 0}
          >
            <span class="action-icon">📥</span>
            Export
          </button>
        </div>
      </div>
      
      <div class="json-container">
        <pre class="json-content">{formatJson(rawOnchain)}</pre>
      </div>
    
    {:else if activeSection === 'prices'}
      <div class="section-header">
        <div class="section-info">
          <h4>Price Response Data</h4>
          <p class="section-meta">
            Price data from API • {getDataSize(priceResponse)}
          </p>
        </div>
        <div class="section-actions">
          <button
            type="button"
            on:click={() => handleExport('prices')}
            class="action-button export"
            disabled={!priceResponse}
          >
            <span class="action-icon">📥</span>
            Export
          </button>
        </div>
      </div>
      
      <div class="json-container">
        <pre class="json-content">{formatJson(priceResponse)}</pre>
      </div>
    
    {:else if activeSection === 'coinlist'}
      <div class="section-header">
        <div class="section-info">
          <h4>CoinGecko Coin List</h4>
          <p class="section-meta">
            {coinList.length} coins • {getDataSize(coinList)}
          </p>
        </div>
        <div class="section-actions">
          <button
            type="button"
            on:click={handleRefreshCoinList}
            class="action-button refresh"
            disabled={loading}
          >
            <span class="action-icon" class:spinning={loading}>🔄</span>
            Refresh List
          </button>
          <button
            type="button"
            on:click={() => handleExport('coinlist')}
            class="action-button export"
            disabled={coinList.length === 0}
          >
            <span class="action-icon">📥</span>
            Export
          </button>
        </div>
      </div>
      
      {#if coinListError}
        <div class="error-message" role="alert">
          <span class="error-icon">⚠️</span>
          {coinListError}
        </div>
      {/if}
      
      <div class="json-container">
        <pre class="json-content">{formatJson(coinList)}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .raw-data-viewer {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .viewer-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .format-controls {
    display: flex;
    align-items: center;
  }
  
  .format-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    cursor: pointer;
  }
  
  .format-toggle input[type="checkbox"] {
    accent-color: #3b82f6;
  }
  
  .section-tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .tab-button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .tab-button:hover {
    background: #f3f4f6;
  }
  
  .tab-button.active {
    background: white;
    border-bottom-color: #3b82f6;
  }
  
  .tab-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }
  
  .tab-count,
  .tab-size {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
  
  .tab-button.active .tab-label {
    color: #3b82f6;
    font-weight: 600;
  }
  
  .data-section {
    background: white;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .section-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }
  
  .section-meta {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
  }
  
  .section-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .action-button:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }
  
  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .action-button.refresh {
    color: #3b82f6;
    border-color: #93c5fd;
  }
  
  .action-button.refresh:hover:not(:disabled) {
    background: #eff6ff;
  }
  
  .action-button.export {
    color: #059669;
    border-color: #6ee7b7;
  }
  
  .action-button.export:hover:not(:disabled) {
    background: #ecfdf5;
  }
  
  .action-icon {
    font-size: 1rem;
    transition: transform 0.3s ease;
  }
  
  .action-icon.spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #dc2626;
    font-weight: 500;
  }
  
  .json-container {
    max-height: 60vh;
    overflow: auto;
    background: #f8fafc;
  }
  
  .json-content {
    padding: 1.5rem;
    margin: 0;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #374151;
    background: transparent;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  /* JSON syntax highlighting */
  .json-content {
    color: #1f2937;
  }
  
  /* Custom scrollbar for webkit browsers */
  .json-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .json-container::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .json-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  
  .json-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  @media (max-width: 768px) {
    .viewer-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .section-actions {
      width: 100%;
      justify-content: stretch;
    }
    
    .section-actions .action-button {
      flex: 1;
      justify-content: center;
    }
    
    .section-tabs {
      flex-direction: column;
    }
    
    .tab-button {
      flex-direction: row;
      justify-content: space-between;
      border-bottom: 1px solid #e5e7eb;
      border-right: none;
    }
    
    .tab-button.active {
      border-bottom-color: #e5e7eb;
      border-left: 3px solid #3b82f6;
    }
  }
</style>
