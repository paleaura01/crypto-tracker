<script lang="ts">
  import type { ExchangeV3Account } from '$lib/server/types';

  export let accounts: ExchangeV3Account[] = [];
</script>

<div class="dark:text-white mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Exchange Balances</h2>
  {#if accounts.length}
    <ul class="list-disc pl-5">
      {#each accounts
        .filter(a => Number(a.available_balance?.value ?? 0) > 0)
        as acct, idx (`v3-${acct.id ?? idx}`)}
        <li>
          {acct.currency}:
          {acct.available_balance?.value ?? acct.balance?.value ?? 0}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No balances found.</p>
  {/if}
</div>
