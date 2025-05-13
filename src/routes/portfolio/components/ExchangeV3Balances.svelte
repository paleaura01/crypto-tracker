<script lang="ts">

  import type { ExchangeV3Account } from '../lib/cbexchangev3';
  export let accounts: ExchangeV3Account[] = [];
</script>

<h2>Your Advanced Trade Balances</h2>
{#if accounts.length}
  <ul>
    {#each accounts as acct (acct.id)}
      {#if acct.available_balance?.value && +acct.available_balance.value > 0}
        <li>
          {acct.currency}: {acct.available_balance.value}
          <!-- guard hold_balance too: -->
          (hold: {acct.hold_balance?.value ?? '0'})
        </li>
      {/if}
    {/each}
  </ul>
{:else}
  <p>No advanced-trade balances.</p>
{/if}
