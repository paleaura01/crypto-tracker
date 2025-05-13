<script lang="ts">
  import type { WalletAccount } from '../lib/cbwallet';
  export let accounts: WalletAccount[] = [];
</script>

<h2>Your Non-Custodial Wallet</h2>
{#if accounts.length}
  <ul>
    {#each accounts as w}
      <li>{w.balance.currency}: {w.balance.amount}</li>
    {/each}
  </ul>
{:else}
  <p><em>No on-chain balances found.</em></p>
{/if}
