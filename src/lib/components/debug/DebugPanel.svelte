<!-- DebugPanel.svelte - Debug information and controls -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DebugPanelProps } from '../types';

  // Props
  export let debugInfo: DebugPanelProps['debugInfo'] = {
    refreshDetector: null,
    streamEvents: [],
    cacheStatus: null,
    performanceMetrics: null
  };
  export let coinListLoading: boolean = false;
  export let coinListError: string | null = null;
  export let balancesLoading: boolean = false;
  
  // Debug logging to verify what we're receiving
  $: if (debugInfo.streamEvents) {
    console.log(`[DebugPanel] Received ${debugInfo.streamEvents.length} stream events:`, debugInfo.streamEvents);
  }

  // Events
  const dispatch = createEventDispatcher<{
    refreshCoinList: void;
    refreshBalances: void;
    clearDebugEvents: void;
    exportDebugData: void;
    migrateToDatabase: void;
    clearDatabaseData: void;
    loadFromDatabase: void;
  }>();
  // Local state
  let showPerformance = false;
  let showStreamEvents = true; // Show events by default since they're critical for debugging
  
  // Add debugging to see what debugInfo contains
  $: {
    console.log('DebugPanel - debugInfo:', debugInfo);
    console.log('DebugPanel - streamEvents:', debugInfo.streamEvents);
    console.log('DebugPanel - streamEvents length:', debugInfo.streamEvents?.length);
    console.log('DebugPanel - streamEvents type:', typeof debugInfo.streamEvents);
    console.log('DebugPanel - streamEvents is array:', Array.isArray(debugInfo.streamEvents));
  }

  // Debug stream event formatting
  function formatDebugEvent(event: { timestamp: string | number; type: string; message: string }) {
    const timestamp = typeof event.timestamp === 'string' 
      ? new Date(event.timestamp).toLocaleTimeString()
      : new Date(event.timestamp).toLocaleTimeString();
    return `[${timestamp}] ${event.type}: ${event.message}`;
  }

  // Export debug data as JSON
  function handleExportDebug() {
    dispatch('exportDebugData');
  }

  // Clear debug events
  function handleClearEvents() {
    dispatch('clearDebugEvents');
  }

  // Refresh actions
  function handleRefreshCoinList() {
    dispatch('refreshCoinList');
  }

  function handleRefreshBalances() {
    dispatch('refreshBalances');
  }
</script>

<div class="debug-panel">
  <div class="debug-header">
    <h3 class="text-lg font-semibold text-gray-800">Debug Information</h3>
    <div class="debug-actions">
      <button
        type="button"
        on:click={handleExportDebug}
        class="btn-debug btn-primary"
        title="Export all debug data as JSON"
      >
        📊 Export
      </button>
      <button
        type="button"
        on:click={handleClearEvents}
        class="btn-debug btn-secondary"
        title="Clear debug event log"
      >
        🗑️ Clear
      </button>
    </div>
  </div>

  <!-- Status Overview -->
  <div class="debug-section">
    <h4 class="debug-section-title">System Status</h4>
    <div class="status-grid">
      <div class="status-item">
        <span class="status-label">Refresh Detection:</span>
        <span class="status-value {debugInfo.refreshDetector ? 'active' : 'inactive'}">
          {debugInfo.refreshDetector ? '✅ Active' : '❌ Inactive'}
        </span>
      </div>
      
      <div class="status-item">
        <span class="status-label">Cache Status:</span>
        <span class="status-value {debugInfo.cacheStatus?.healthy ? 'active' : 'warning'}">
          {debugInfo.cacheStatus?.healthy ? '✅ Healthy' : '⚠️ Issues'}
        </span>
      </div>
        <div class="status-item">
        <span class="status-label">Environment:</span>
        <span class="status-value active">
          {import.meta.env.DEV ? '🛠️ Development' : '🚀 Production'}
        </span>
      </div>
      
      {#if debugInfo.authStatus}
        <div class="status-item">
          <span class="status-label">Authentication:</span>
          <span class="status-value {debugInfo.authStatus.isAuthenticated ? 'active' : 'inactive'}">
            {debugInfo.authStatus.isAuthenticated ? '🔐 Authenticated' : '🔓 Guest Mode'}
          </span>
        </div>
        
        {#if debugInfo.authStatus.userEmail}
          <div class="status-item">
            <span class="status-label">User:</span>
            <span class="status-value active">
              {debugInfo.authStatus.userEmail}
            </span>
          </div>
        {/if}
        
        <div class="status-item">
          <span class="status-label">Local Data:</span>
          <span class="status-value {debugInfo.authStatus.hasLocalData ? 'warning' : 'inactive'}">
            {debugInfo.authStatus.hasLocalData ? '⚠️ Has Local Data' : '✅ No Local Data'}
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Data Migration Section -->
  {#if debugInfo.authStatus}
    <div class="debug-section">
      <h4 class="debug-section-title">Data Management</h4>
      <div class="migration-controls">
        {#if debugInfo.authStatus.isAuthenticated}
          {#if debugInfo.authStatus.hasLocalData}
            <button
              type="button"
              on:click={() => dispatch('migrateToDatabase')}
              class="btn-debug btn-primary"
              title="Migrate localStorage data to Supabase database"
            >
              📤 Migrate to Database
            </button>
          {/if}
          
          <button
            type="button"
            on:click={() => dispatch('clearDatabaseData')}
            class="btn-debug btn-danger"
            title="Clear all wallet data from database"
          >
            🗑️ Clear Database
          </button>
          
          <button
            type="button"
            on:click={() => dispatch('loadFromDatabase')}
            class="btn-debug btn-secondary"
            title="Reload wallet data from database"
          >
            🔄 Reload from DB
          </button>        {:else}          <div class="migration-warning">
            <p class="text-sm text-gray-600">
              🔒 Log in to access database persistence and migration features
            </p>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Performance Metrics -->
  {#if debugInfo.performanceMetrics}
    <div class="debug-section">
      <div class="section-header">
        <h4 class="debug-section-title">Performance Metrics</h4>
        <button
          type="button"
          on:click={() => showPerformance = !showPerformance}
          class="toggle-btn"
        >
          {showPerformance ? '📉' : '📈'}
        </button>
      </div>
      
      {#if showPerformance}
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Load Time:</span>
            <span class="metric-value">
              {debugInfo.performanceMetrics.loadTime}ms
            </span>
          </div>
          
          <div class="metric-item">
            <span class="metric-label">API Calls:</span>
            <span class="metric-value">
              {debugInfo.performanceMetrics.apiCalls}
            </span>
          </div>
          
          <div class="metric-item">
            <span class="metric-label">Cache Hits:</span>
            <span class="metric-value">
              {debugInfo.performanceMetrics.cacheHits}/{debugInfo.performanceMetrics.cacheAttempts}
            </span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Debug Stream Events -->
  <div class="debug-section">
    <div class="section-header">
      <h4 class="debug-section-title">
        Debug Events ({debugInfo.streamEvents?.length || 0})
      </h4>
      <button
        type="button"
        on:click={() => showStreamEvents = !showStreamEvents}
        class="toggle-btn"
      >
        {showStreamEvents ? '📋' : '📝'}
      </button>
    </div>      {#if showStreamEvents}
      <div class="events-container">
        <!-- Debug info display -->
        <div class="event-item info">
          DEBUG: streamEvents = {JSON.stringify(debugInfo.streamEvents)}
        </div>
        <div class="event-item info">
          DEBUG: streamEvents length = {debugInfo.streamEvents?.length || 'undefined'}
        </div>
        <div class="event-item info">
          DEBUG: streamEvents type = {typeof debugInfo.streamEvents}
        </div>
        
        {#if debugInfo.streamEvents && debugInfo.streamEvents.length > 0}
          {#each debugInfo.streamEvents as event, index (event.timestamp || index)}
            <div class="event-item {event.type.toLowerCase().replace('_', '-')}">
              {formatDebugEvent(event)}
            </div>
          {/each}
        {:else}
          <div class="event-item info">
            No debug events logged yet
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Refresh Controls -->
  <div class="debug-section">
    <h4 class="debug-section-title">Refresh Controls</h4>
    <div class="refresh-controls">
      <button
        type="button"
        on:click={handleRefreshBalances}
        class="refresh-btn"
        disabled={balancesLoading}
        title="Refresh wallet balance data"
      >
        {#if balancesLoading}
          <span class="loading-spinner"></span>
          Refreshing...
        {:else}
          🔄 Refresh Balances
        {/if}
      </button>
      
      <button
        type="button"
        on:click={handleRefreshCoinList}
        class="refresh-btn"
        disabled={coinListLoading}
        title="Refresh CoinGecko coin list"
      >
        {#if coinListLoading}
          <span class="loading-spinner"></span>
          Refreshing...
        {:else}
          🔄 Refresh Coin List
        {/if}      </button>
    </div>
    
    {#if coinListError}
      <div class="error-message">
        ❌ Coin List Error: {coinListError}
      </div>
    {/if}
  </div>

  <!-- Debug Information Notice -->
  <div class="debug-notice">
    <p class="text-sm text-gray-600">
      💡 Debug events are streamed to <code>static/data/debug-stream.log</code> for real-time monitoring.
      Critical save operations and refresh detection events are logged there.
    </p>
  </div>
</div>

<style>
  .debug-panel {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: #f9fafb;
  }

  .debug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .debug-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-debug {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: colors 0.2s;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-secondary {
    background-color: #6b7280;
    color: white;
  }
  .btn-secondary:hover {
    background-color: #4b5563;
  }

  .btn-danger {
    background-color: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background-color: #b91c1c;
  }

  .migration-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .migration-warning {
    padding: 0.75rem;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 0.25rem;
    color: #92400e;
  }

  .debug-section {
    margin-bottom: 1rem;
  }

  .debug-section:last-child {
    margin-bottom: 0;
  }

  .debug-section-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .toggle-btn {
    font-size: 1.25rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .toggle-btn:hover {
    background-color: #e5e7eb;
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .status-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: white;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
  }

  .status-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
  }

  .status-value {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-value.active {
    color: #059669;
  }

  .status-value.inactive {
    color: #dc2626;
  }

  .status-value.warning {
    color: #d97706;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (min-width: 640px) {
    .metrics-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: white;
    border-radius: 0.25rem;
    border: 1px solid #d1d5db;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .metric-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
  }
  .events-container {
    max-height: 20rem;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  .event-item {
    font-size: 0.75rem;
    font-family: monospace;
    padding: 0.25rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .event-item:last-child {
    border-bottom: none;
  }
  .event-item.save-start {
    color: #2563eb;
  }

  .event-item.save-complete {
    color: #059669;
  }

  .event-item.save-error {
    color: #dc2626;
  }

  .event-item.db-error {
    color: #dc2626;
    font-weight: 600;
  }

  .event-item.wallet-added {
    color: #059669;
  }

  .event-item.balances-loaded {
    color: #059669;
  }

  .event-item.portfolio-computed {
    color: #2563eb;
  }

  .event-item.refresh-detected {
    color: #ea580c;
  }

  .event-item.info {
    color: #6b7280;
    font-style: italic;
  }

  .refresh-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .refresh-btn {
    padding: 0.5rem 1rem;
    background-color: #3b82f6;
    color: white;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .refresh-btn:hover {
    background-color: #2563eb;
  }

  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid white;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.25rem;
  }

  .debug-notice {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .debug-notice code {
    background-color: #e5e7eb;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
</style>
