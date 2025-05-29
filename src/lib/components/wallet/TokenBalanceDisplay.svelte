<!-- Token Balance Display Component -->
<script lang="ts">
  import type { TokenBalance } from '../../types/index.js';
  import { formatCryptoAmount, formatCurrency } from '../../utils/formatters.js';

  export let balance: TokenBalance;
  export let showValue: boolean = true;
  export let compact: boolean = false;

  $: formattedBalance = formatCryptoAmount(balance.balance, balance.symbol, {
    decimals: compact ? 4 : 6,
    showSymbol: !compact
  });

  $: formattedValue = showValue ? formatCurrency(balance.value_usd) : '';
</script>

<div class="token-balance" class:compact>  <div class="token-info">
    {#if balance.logo_url}
      <img src={balance.logo_url} alt={balance.symbol} class="token-logo" />
    {/if}
    <div class="token-details">
      <div class="token-symbol">{balance.symbol}</div>
      {#if !compact}
        <div class="token-name">{balance.name}</div>
      {/if}
    </div>
  </div>
  
  <div class="balance-info">
    <div class="balance-amount">{formattedBalance}</div>
    {#if showValue && balance.value_usd > 0}
      <div class="balance-value">{formattedValue}</div>
    {/if}
  </div>
</div>

<style>
  .token-balance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    margin-bottom: 8px;
  }

  .token-balance.compact {
    padding: 8px;
    margin-bottom: 4px;
  }

  .token-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .token-logo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .token-details {
    display: flex;
    flex-direction: column;
  }

  .token-symbol {
    font-weight: 600;
    color: #111827;
  }

  .token-name {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .balance-info {
    text-align: right;
  }

  .balance-amount {
    font-weight: 600;
    color: #111827;
  }

  .balance-value {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .compact .token-logo {
    width: 20px;
    height: 20px;
  }

  .compact .token-symbol {
    font-size: 0.875rem;
  }

  .compact .balance-amount {
    font-size: 0.875rem;
  }
</style>
