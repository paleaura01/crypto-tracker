<script lang="ts">
  import type { ExchangeV2Account } from '$lib/server/types';
  export let accounts: ExchangeV2Account[] = [];
</script>

<section class="dark:text-white  mb-6">
  <h2 class="text-xl font-semibold">Coinbase Advanced Exchange Balances</h2>
  {#if accounts.length}
    <ul class="list-disc pl-5">
      {#each accounts as acct}
        {#if +acct.balance.amount > 0}
          <li>{acct.currency.code}: {acct.balance.amount}</li>
        {/if}
      {/each}
    </ul>
  {:else}
    <p>No balances found.</p>
  {/if}
</section>
