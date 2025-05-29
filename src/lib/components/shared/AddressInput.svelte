<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let address: string = '';
  export let loading: boolean = false;
  export let error: string = '';
  export let placeholder: string = 'Enter wallet address (0x...)';
  export let disabled: boolean = false;
  
  const dispatch = createEventDispatcher<{
    submit: { address: string };
    clear: void;
    change: { address: string };
  }>();
  
  let isValid = false;
  
  // Validate Ethereum address format
  function validateAddress(addr: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }
  
  // Handle address input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    address = target.value;
    isValid = validateAddress(address);
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
    
    error = '';
    dispatch('submit', { address: address.trim() });
  }
  
  // Clear the address input
  function handleClear() {
    address = '';
    error = '';
    isValid = false;
    dispatch('clear');
  }
  
  $: isValid = validateAddress(address);
</script>

<div class="address-input-container">
  <form on:submit={handleSubmit} class="address-form">
    <div class="input-group">
      <div class="input-wrapper">
        <input
          type="text"
          bind:value={address}
          on:input={handleInput}
          {placeholder}
          {disabled}
          class="address-input"
          class:valid={isValid && address}
          class:invalid={address && !isValid}
        />
        {#if address}
          <button
            type="button"
            on:click={handleClear}
            class="clear-button"
            title="Clear address"
            {disabled}
          >
            ✕
          </button>
        {/if}
      </div>
      
      <button
        type="submit"
        class="submit-button"
        disabled={loading || !isValid || disabled}
      >
        {#if loading}
          <span class="loading-spinner"></span>
          Loading...
        {:else}
          Get Balance
        {/if}
      </button>
    </div>
    
    {#if error}
      <div class="error-message" role="alert">
        {error}
      </div>
    {/if}
    
    {#if address && isValid}
      <div class="validation-status success">
        ✓ Valid Ethereum address
      </div>
    {:else if address && !isValid}
      <div class="validation-status error">
        ✗ Invalid address format
      </div>
    {/if}
  </form>
</div>

<style>
  .address-input-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  
  .address-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }
  
  .input-wrapper {
    position: relative;
    flex: 1;
  }
  
  .address-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    transition: all 0.15s ease;
  }
  
  .address-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .address-input.valid {
    border-color: #10b981;
    background-color: #f0fdf4;
  }
  
  .address-input.invalid {
    border-color: #ef4444;
    background-color: #fef2f2;
  }
  
  .address-input:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
  
  .clear-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.75rem;
    transition: background-color 0.15s ease;
  }
  
  .clear-button:hover:not(:disabled) {
    background: #374151;
  }
  
  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .submit-button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  
  .submit-button:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
  }
  
  .submit-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .error-message {
    padding: 0.75rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .validation-status {
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .validation-status.success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  
  .validation-status.error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  @media (max-width: 640px) {
    .input-group {
      flex-direction: column;
    }
    
    .submit-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
