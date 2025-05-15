<script lang="ts">
  import type { ExchangeV3Account } from '$lib/types/database';
  export let accounts: ExchangeV3Account[] = [];
</script>

<section>
  <h2 class="text-xl font-semibold mb-2">Coinbase Account Balances (v3)</h2>
  {#if accounts.length}
    <ul class="list-disc pl-5">
      {#each accounts
        .filter(a => Number(a.available_balance?.value ?? 0) > 0)
        as acct, idx (`v3-${acct.id ?? idx}`)}
        <!-- V3 uses acct.available_balance.value -->
        <li>
          {acct.currency}: {acct.available_balance?.value ?? acct.balance?.value ?? 0}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No v3 balances found.</p>
  {/if}
</section>
