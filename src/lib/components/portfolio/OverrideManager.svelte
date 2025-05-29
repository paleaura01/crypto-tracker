<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let symbolOverrides: Record<string, string | null> = {};
  export let addressOverrides: Record<string, string | null> = {};
  export let availableTokens: Array<{ symbol: string; contractAddress: string; chain: string }> = [];
  export let coinList: Array<{ id: string; symbol: string; name: string }> = [];
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher<{
    symbolOverride: { contractAddress: string; symbol: string | null };
    addressOverride: { contractAddress: string; coinGeckoId: string | null };
  }>();
  
  let activeTab: 'symbols' | 'addresses' = 'symbols';
  let editingSymbol: string | null = null;
  let editingAddress: string | null = null;
  let editSymbolCgId = '';
  let editAddressCgId = '';
  let searchQuery = '';
  
  // Get unique symbols from available tokens
  $: uniqueSymbols = Array.from(new Set(availableTokens.map(t => t.symbol.toUpperCase())));
  
  // Get unique addresses with their details
  $: uniqueAddresses = Array.from(
    new Map(
      availableTokens.map(t => [
        `${t.contractAddress.toLowerCase()}-${t.chain}`,
        { address: t.contractAddress.toLowerCase(), symbol: t.symbol, chain: t.chain }
      ])
    ).values()
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
  function saveSymbolOverride() {
    if (!editingSymbol) return;
    
    let symbol: string | null = null;
    
    if (editSymbolCgId === '__NONE__') {
      symbol = null; // Explicitly exclude
    } else if (editSymbolCgId && editSymbolCgId.trim()) {
      symbol = editSymbolCgId.trim();
    }
    
    // Find the contract address for this symbol
    const token = availableTokens.find(t => t.symbol.toUpperCase() === editingSymbol);
    if (token) {
      dispatch('symbolOverride', { 
        contractAddress: token.contractAddress,
        symbol 
      });
    }
    
    editingSymbol = null;
    editSymbolCgId = '';
  }
  
  // Save address override
  function saveAddressOverride() {
    if (!editingAddress) return;
    
    let coinGeckoId: string | null = null;
    
    if (editAddressCgId && editAddressCgId.trim()) {
      coinGeckoId = editAddressCgId.trim();
    }
    
    dispatch('addressOverride', { 
      contractAddress: editingAddress,
      coinGeckoId 
    });
    
    editingAddress = null;
    editAddressCgId = '';
  }
  
  // Remove override
  function removeOverride(type: 'symbol' | 'address', key: string) {
    if (type === 'symbol') {
      // Find the contract address for this symbol
      const token = availableTokens.find(t => t.symbol.toUpperCase() === key);
      if (token) {
        dispatch('symbolOverride', { 
          contractAddress: token.contractAddress,
          symbol: null 
        });
      }
    } else {
      dispatch('addressOverride', { 
        contractAddress: key,
        coinGeckoId: null 
      });
    }
  }
  
  // Cancel editing
  function cancelEdit() {
    editingSymbol = null;
    editingAddress = null;
    editSymbolCgId = '';
    editAddressCgId = '';
    searchQuery = '';
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
</script>

<div class="override-manager">
  <div class="manager-header">
    <h3 class="manager-title">Token & Address Overrides</h3>
    <div class="tab-buttons">
      <button
        type="button"
        on:click={() => activeTab = 'symbols'}
        class="tab-button"
        class:active={activeTab === 'symbols'}
      >
        Symbol Overrides
      </button>
      <button
        type="button"
        on:click={() => activeTab = 'addresses'}
        class="tab-button"
        class:active={activeTab === 'addresses'}
      >
        Address Overrides
      </button>
    </div>
  </div>
  
  {#if activeTab === 'symbols'}
    <div class="override-section">
      <div class="section-header">
        <h4>Symbol Overrides</h4>
        <p class="section-description">
          Override CoinGecko IDs for specific token symbols to ensure accurate price matching.
        </p>
      </div>
        <div class="override-list">
        {#each uniqueSymbols as symbol (symbol)}
          {@const hasOverride = symbolOverrides[symbol] !== undefined}
          {@const overrideValue = symbolOverrides[symbol]}
          
          <div class="override-item">
            <div class="item-info">
              <span class="item-label">{symbol}</span>
              {#if hasOverride}
                <span class="override-value">
                  {#if overrideValue === null}
                    <span class="excluded">Excluded</span>
                  {:else}
                    → {overrideValue}
                  {/if}
                </span>
              {:else}
                <span class="no-override">Auto-detect</span>
              {/if}
            </div>
            
            <div class="item-actions">
              <button
                type="button"
                on:click={() => startEditSymbol(symbol)}
                class="edit-button"
                {disabled}
              >
                Edit
              </button>
              {#if hasOverride}
                <button
                  type="button"
                  on:click={() => removeOverride('symbol', symbol)}
                  class="remove-button"
                  {disabled}
                >
                  Remove
                </button>
              {/if}
            </div>
          </div>
          
          {#if editingSymbol === symbol}
            <div class="edit-form">
              <div class="form-content">
                <div class="input-group">
                  <input
                    bind:value={searchQuery}
                    placeholder="Search coins..."
                    class="search-input"
                  />
                  <input
                    bind:value={editSymbolCgId}
                    placeholder="Or type CoinGecko ID manually (e.g. bitcoin)"
                    class="manual-input"
                  />
                </div>
                
                {#if searchQuery && filteredCoinList.length > 0}
                  <div class="coin-dropdown">
                    <div class="dropdown-header">Select from CoinGecko:</div>
                    {#each filteredCoinList.slice(0, 10) as coin (coin.id)}
                      <button
                        type="button"
                        on:click={() => selectCoin(coin.id)}
                        class="coin-option"
                      >
                        <span class="coin-symbol">{coin.symbol.toUpperCase()}</span>
                        <span class="coin-name">{coin.name}</span>
                        <span class="coin-id">{coin.id}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
                
                <div class="special-options">
                  <button
                    type="button"
                    on:click={() => { editSymbolCgId = '__NONE__'; }}
                    class="exclude-button"
                  >
                    Exclude from pricing
                  </button>
                </div>
                
                <div class="form-actions">
                  <button
                    type="button"
                    on:click={saveSymbolOverride}
                    class="save-button"
                    {disabled}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    on:click={cancelEdit}
                    class="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <div class="override-section">
      <div class="section-header">
        <h4>Address Overrides</h4>
        <p class="section-description">
          Override CoinGecko IDs for specific contract addresses when auto-detection fails.
        </p>
      </div>
      
      <div class="override-list">
        {#each uniqueAddresses as { address, symbol, chain } (`${address}-${chain}`)}
          {@const hasOverride = addressOverrides[address] !== undefined}
          {@const overrideValue = addressOverrides[address]}
          
          <div class="override-item">
            <div class="item-info">
              <div class="address-details">
                <span class="address-text">{address}</span>
                <span class="token-details">({symbol} on {chain})</span>
              </div>
              {#if hasOverride}
                <span class="override-value">→ {overrideValue}</span>
              {:else}
                <span class="no-override">Auto-detect</span>
              {/if}
            </div>
            
            <div class="item-actions">
              <button
                type="button"
                on:click={() => startEditAddress(address)}
                class="edit-button"
                {disabled}
              >
                Edit
              </button>
              {#if hasOverride}
                <button
                  type="button"
                  on:click={() => removeOverride('address', address)}
                  class="remove-button"
                  {disabled}
                >
                  Remove
                </button>
              {/if}
            </div>
          </div>
          
          {#if editingAddress === address}
            <div class="edit-form">
              <div class="form-content">
                <div class="input-group">
                  <input
                    bind:value={searchQuery}
                    placeholder="Search coins..."
                    class="search-input"
                  />
                  <input
                    bind:value={editAddressCgId}
                    placeholder="Or type CoinGecko ID manually (e.g. bitcoin)"
                    class="manual-input"
                  />
                </div>
                
                {#if searchQuery && filteredCoinList.length > 0}
                  <div class="coin-dropdown">
                    <div class="dropdown-header">Select from CoinGecko:</div>
                    {#each filteredCoinList.slice(0, 10) as coin (coin.id)}
                      <button
                        type="button"
                        on:click={() => selectCoin(coin.id)}
                        class="coin-option"
                      >
                        <span class="coin-symbol">{coin.symbol.toUpperCase()}</span>
                        <span class="coin-name">{coin.name}</span>
                        <span class="coin-id">{coin.id}</span>
                      </button>
                    {/each}
                  </div>
                {/if}
                
                <div class="form-actions">
                  <button
                    type="button"
                    on:click={saveAddressOverride}
                    class="save-button"
                    {disabled}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    on:click={cancelEdit}
                    class="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .override-manager {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .manager-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .manager-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 1rem 0;
  }
  
  .tab-buttons {
    display: flex;
    gap: 1px;
    background: #e5e7eb;
    border-radius: 6px;
    padding: 2px;
  }
  
  .tab-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background: white;
    border: none;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 4px;
  }
  
  .tab-button.active {
    background: #3b82f6;
    color: white;
  }
  
  .tab-button:hover:not(.active) {
    background: #f3f4f6;
  }
  
  .override-section {
    padding: 1.5rem;
  }
  
  .section-header {
    margin-bottom: 1.5rem;
  }
  
  .section-header h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.5rem 0;
  }
  
  .section-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
  
  .override-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .override-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }
  
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }
  
  .item-label {
    font-weight: 600;
    color: #111827;
    font-size: 0.875rem;
  }
  
  .address-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .address-text {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 0.75rem;
    color: #111827;
    word-break: break-all;
  }
  
  .token-details {
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .override-value {
    font-size: 0.75rem;
    color: #059669;
    font-weight: 500;
  }
  
  .no-override {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }
  
  .excluded {
    color: #dc2626;
    font-weight: 500;
  }
  
  .item-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-button,
  .remove-button,
  .save-button,
  .cancel-button {
    padding: 0.375rem 0.75rem;
    border: 1px solid;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .edit-button {
    background: white;
    border-color: #d1d5db;
    color: #374151;
  }
  
  .edit-button:hover:not(:disabled) {
    background: #f3f4f6;
  }
  
  .remove-button {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }
  
  .remove-button:hover:not(:disabled) {
    background: #fee2e2;
  }
  
  .save-button {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }
  
  .save-button:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .cancel-button {
    background: #6b7280;
    border-color: #6b7280;
    color: white;
  }
  
  .cancel-button:hover {
    background: #374151;
  }
  
  .edit-form {
    margin-top: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }
  
  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .search-input,
  .manual-input {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .search-input:focus,
  .manual-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .coin-dropdown {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
  }
  
  .dropdown-header {
    padding: 0.5rem 0.75rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
  }
  
  .coin-option {
    display: block;
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .coin-option:hover {
    background: #f9fafb;
  }
  
  .coin-option:last-child {
    border-bottom: none;
  }
  
  .coin-symbol {
    font-weight: 600;
    color: #111827;
    font-size: 0.875rem;
  }
  
  .coin-name {
    display: block;
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: 0.125rem;
  }
  
  .coin-id {
    display: block;
    color: #9ca3af;
    font-size: 0.75rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
  
  .special-options {
    padding: 0.5rem 0;
    border-top: 1px solid #e5e7eb;
  }
  
  .exclude-button {
    padding: 0.5rem 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .exclude-button:hover {
    background: #fee2e2;
  }
  
  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  @media (max-width: 768px) {
    .override-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .item-actions {
      justify-content: flex-end;
    }
    
    .form-actions {
      justify-content: stretch;
    }
    
    .form-actions button {
      flex: 1;
    }
  }
</style>
