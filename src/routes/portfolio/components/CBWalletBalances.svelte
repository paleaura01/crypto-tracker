<!-- src/routes/portfolio/components/CBWalletBalances.svelte -->
<script lang="ts">
  import type { WalletAccount } from '$lib/server/types';
  export let wallets: WalletAccount[] = [];
</script>

<div class="mb-6 dark:text-white">
  <h2 class="text-xl font-semibold mb-2">Coinbase Custodial Wallet</h2>

  {#if wallets.length > 0}
    <!-- You’ll replace this later with real UI -->
    <p>No Custodial Wallet Loaded.</p>
  {:else}
    <p>No Custodial Wallet Loaded.</p>
  {/if}
</div>
