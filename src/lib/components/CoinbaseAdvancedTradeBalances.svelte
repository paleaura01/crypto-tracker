<script lang="ts">
  import type { ExchangeV2Account } from '$lib/types/database';
  export let accounts: ExchangeV2Account[] = [];
</script>

<section>
  <h2 class="text-xl font-semibold mb-2">Your Exchange Balances (v2)</h2>
  {#if accounts.length}
    <ul class="list-disc pl-5">
      {#each accounts as acct}
        {#if +acct.balance.amount > 0}
          <li>{acct.currency.code}: {acct.balance.amount}</li>
        {/if}
      {/each}
    </ul>
  {:else}
    <p>No v2 balances.</p>
  {/if}
</section>
