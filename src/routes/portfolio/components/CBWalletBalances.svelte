<script lang="ts">
  import type { WalletAccount } from '$lib/server/types';

  export let wallets: WalletAccount[] = [];
</script>

<div class="mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Wallet</h2>
  {#if wallets.length}
    <ul class="list-disc pl-5">
      {#each wallets
        .filter(w => Number(w.balance.amount ?? 0) > 0)
        as acct, idx (`wallet-${acct.id ?? idx}`)}
        <li>
          {acct.balance.currency}:
          {acct.balance.amount}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No wallet balances.</p>
  {/if}
</div>
