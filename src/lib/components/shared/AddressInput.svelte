<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { supabaseMCPWalletService } from '$lib/services/supabase-mcp-wallet-service';
  import { authService } from '$lib/services/auth-service';
    export let address: string = '';
  export let loading: boolean = false;
  export let error: string = '';
  export let placeholder: string = 'Enter wallet address (0x...)';
  export let disabled: boolean = false;
  export let showSaveButton: boolean = true;
  export let existingAddresses: string[] = [];
    const dispatch = createEventDispatcher<{
    submit: { address: string };
    clear: void;
    change: { address: string };
    save: { address: string; label?: string | undefined };
  }>();
    let isValid = false;
  let saving = false;
  let saveError = '';
  let saveSuccess = false;
  let addressLabel = '';
  let showSaveForm = false;
  let savedAddresses: Array<{ id: string; address: string; label?: string; blockchain: string }> = [];
  let isDuplicate = false;  // Validate Ethereum address format
  function validateAddress(addr: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }
  
  // Check if address is duplicate
  function checkDuplicate(addr: string): boolean {
    if (!addr || !addr.trim()) return false;
    return existingAddresses.some(existing => 
      existing.toLowerCase() === addr.toLowerCase()
    );
  }
    // Handle address input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    address = target.value;
    isValid = validateAddress(address);
    isDuplicate = checkDuplicate(address);
    saveSuccess = false;
    saveError = '';
    
    // Set error if duplicate is detected
    if (isDuplicate && address.trim()) {
      error = 'This wallet address is already added';
    } else if (address.trim() && !isValid) {
      error = 'Please enter a valid Ethereum address';
    } else {
      error = '';
    }
    
    dispatch('change', { address });
  }
    // Handle form submission
  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!address.trim()) {
      error = 'Please enter a wallet address';
      return;
    }
    
    if (!isValid) {
      error = 'Please enter a valid Ethereum address';
      return;
    }
    
    if (isDuplicate) {
      error = 'This wallet address is already added';
      return;
    }
    
    error = '';
    dispatch('submit', { address: address.trim() });
  }
    // Clear the address input
  function handleClear() {
    address = '';
    error = '';
    isValid = false;
    isDuplicate = false;
    saveSuccess = false;
    saveError = '';
    showSaveForm = false;
    dispatch('clear');
  }
  
  // Show save form
  function toggleSaveForm() {
    showSaveForm = !showSaveForm;
    saveError = '';
    saveSuccess = false;
    if (showSaveForm) {
      addressLabel = '';
    }
  }    // Save address to Supabase using MCP service
  async function saveAddress() {
    if (!address.trim() || !isValid) {
      saveError = 'Please enter a valid address first';
      return;
    }
    
    if (isDuplicate) {
      saveError = 'This wallet address is already added';
      return;
    }
    
    saving = true;
    saveError = '';
    saveSuccess = false;
    
    try {
      // Check authentication status first
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.data) {
        throw new Error('Authentication required to save addresses');
      }      // Use MCP service for direct database access
      const result = await supabaseMCPWalletService.saveWalletAddress({
        id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: address.trim(),
        label: addressLabel.trim() || `Wallet ${address.slice(0, 8)}...`
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save address via MCP');
      }
      
      saveSuccess = true;
      showSaveForm = false;
      addressLabel = '';
      dispatch('save', { 
        address: address.trim(), 
        label: addressLabel.trim() || undefined 
      });
      
      // Refresh saved addresses
      await loadSavedAddresses();
      
    } catch (err: unknown) {
      saveError = err instanceof Error ? err.message : 'Failed to save address via MCP';
    } finally {
      saving = false;
    }
  }
    // Load saved addresses using MCP service
  async function loadSavedAddresses() {
    try {
      // Check authentication status first
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.data) {
        // User not authenticated, no saved addresses to load
        savedAddresses = [];
        return;
      }

      // Use MCP service for direct database access
      const result = await supabaseMCPWalletService.getWalletAddresses();      if (result.success && result.data) {
        // Map WalletData to the expected interface
        savedAddresses = result.data.map(wallet => ({
          id: wallet.id,
          address: wallet.address,
          label: wallet.label,
          blockchain: 'ethereum' // Default blockchain for all wallets
        }));
      } else {
        savedAddresses = [];
      }
    } catch (err) {
      console.error('Failed to load saved addresses via MCP:', err);
      savedAddresses = [];
    }
  }
    // Load an address from saved list
  function loadSavedAddress(savedAddress: string) {
    address = savedAddress;
    isValid = validateAddress(address);
    isDuplicate = checkDuplicate(address);
    if (isDuplicate) {
      error = 'This wallet address is already added';
    } else {
      error = '';
    }
    dispatch('change', { address });
  }
    // Remove saved address using MCP service
  async function removeSavedAddress(addressId: string) {
    try {
      // Check authentication status first
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.data) {
        console.error('Authentication required to remove addresses');
        return;
      }

      // Find the address to get its actual address value for MCP deletion
      const addressToRemove = savedAddresses.find(addr => addr.id === addressId);
      if (!addressToRemove) {
        console.error('Address not found for removal:', addressId);
        return;
      }      // Use MCP service for direct database access
      const result = await supabaseMCPWalletService.deleteWalletAddress(addressToRemove.id || addressToRemove.address, addressToRemove.address);
      
      if (result.success) {
        await loadSavedAddresses(); // Refresh the list
      } else {
        console.error('Failed to remove address via MCP:', result.error);
      }
    } catch (err) {
      console.error('Failed to remove address via MCP:', err);
    }
  }
  
  // Load saved addresses on component mount
  onMount(() => {
    if (showSaveButton) {
      loadSavedAddresses();
    }
  });
  
  $: isValid = validateAddress(address);
  $: isDuplicate = checkDuplicate(address);
</script>

<div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
  <form on:submit={handleSubmit} class="space-y-6">
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1 relative">        <label for="wallet-address-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Wallet Address
        </label>        <input
          id="wallet-address-input"
          type="text"
          bind:value={address}
          on:input={handleInput}
          {placeholder}
          {disabled}
          class="w-full px-4 py-3 text-sm font-mono border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
            {isDuplicate && address ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}
            {isValid && address && !isDuplicate ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            {address && !isValid && !isDuplicate ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
            {!address ? 'border-gray-300 dark:border-gray-600' : ''}"
        />
        {#if address}
          <button
            type="button"
            on:click={handleClear}
            class="absolute right-3 top-10 w-6 h-6 bg-gray-400 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Clear address"
            {disabled}
          >
            ✕
          </button>
        {/if}
      </div>
      
      <div class="flex flex-col gap-3 lg:self-end">        <button
          type="submit"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg disabled:hover:shadow-none flex items-center justify-center gap-2 whitespace-nowrap min-w-[140px]"
          disabled={loading || !isValid || isDuplicate || disabled}
        >
          {#if loading}
            <div class="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
            Loading...
          {:else}
            🔍 Get Balance
          {/if}
        </button>
          {#if showSaveButton && isValid && address && !isDuplicate}
          <button
            type="button"
            on:click={toggleSaveForm}
            class="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
            disabled={disabled}
          >
            💾 Save Address
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Status Messages -->
    <div class="space-y-3">
      {#if error}
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
          <div class="flex items-center">
            <span class="text-red-500 text-lg mr-2">❌</span>
            <p class="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
          </div>
        </div>
      {/if}
      
      {#if saveSuccess}
        <div class="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
          <div class="flex items-center">
            <span class="text-green-500 text-lg mr-2">✅</span>
            <p class="text-green-800 dark:text-green-200 text-sm font-medium">Address saved successfully!</p>
          </div>
        </div>
      {/if}
    </div>
  </form>  
  <!-- Save form -->
  {#if showSaveForm}
    <div class="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-600">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-2xl">💾</span>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Save Address</h4>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          bind:value={addressLabel}
          placeholder="Optional label (e.g., 'My Main Wallet', 'Trading Account')"
          class="flex-1 px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
        />
        <div class="flex gap-3">
          <button
            type="button"
            on:click={saveAddress}
            class="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            disabled={saving}
          >
            {#if saving}
              <div class="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
              Saving...
            {:else}
              ✅ Save
            {/if}
          </button>
          <button
            type="button"
            on:click={toggleSaveForm}
            class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Cancel
          </button>
        </div>
      </div>
      {#if saveError}
        <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
          <p class="text-red-600 dark:text-red-400 text-sm font-medium">❌ {saveError}</p>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Saved addresses -->
  {#if showSaveButton && savedAddresses.length > 0}
    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-2xl">📚</span>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Saved Addresses</h4>
        <span class="text-sm text-gray-500 dark:text-gray-400">({savedAddresses.length})</span>
      </div>
      <div class="grid gap-3 max-h-60 overflow-y-auto pr-2">
        {#each savedAddresses as savedAddr (savedAddr.id)}
          <div class="group p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md">
            <div class="flex items-center justify-between">
              <button
                type="button"
                on:click={() => loadSavedAddress(savedAddr.address)}
                class="flex-1 text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    🏦
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {savedAddr.label || 'Unlabeled Address'}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 break-all">
                      {savedAddr.address}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        {savedAddr.blockchain}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-label="Remove address"
                on:click={() => removeSavedAddress(savedAddr.id)}
                class="ml-3 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove address"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

