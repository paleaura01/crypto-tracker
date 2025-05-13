<script lang="ts">
  import type { ExchangeV2Account } from '../lib/cbexchangev2';
  export let accounts: ExchangeV2Account[] = [];

  // only USDC & BTC
  $: filtered = accounts.filter(a =>
    a.currency.code === 'USDC' || a.currency.code === 'BTC'
  );
</script>

<h2>Your Exchange Balances</h2>
{#if filtered.length}
  <ul>
    {#each filtered as acct}
      <li>{acct.currency.code}: {acct.balance.amount}</li>
    {/each}
  </ul>
{:else}
  <p>No USDC or BTC balances.</p>
{/if}
