<!-- src/routes/portfolio/components/CBLoanSummary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { btcPrice, startBtcTicker } from '$lib/stores/price';
  import { writable, derived } from 'svelte/store';

  // user inputs
  const collateralBTC = writable<number>(0);
  const borrowedUSDC  = writable<number>(0);

  // computed LTV
  const ltv = derived(
    [collateralBTC, borrowedUSDC, btcPrice],
    ([$coll, $borrow, $price]) =>
      $price !== null && $coll > 0
        ? ($borrow / ($coll * $price)) * 100
        : null
  );

  onMount(() => {
    startBtcTicker();
  });
</script>

<div class="p-4 border rounded max-w-md mx-auto space-y-4">
  <h2 class="text-xl font-semibold">Manual Loan LTV Calculator</h2>

  <div class="grid grid-cols-2 gap-4">
    <label class="flex flex-col">
      <span>Collateral (BTC)</span>
      <input
        type="number"
        min="0"
        step="any"
        bind:value={$collateralBTC}
        class="mt-1 block w-full border p-2 rounded"
      />
    </label>

    <label class="flex flex-col">
      <span>Borrowed (USDC)</span>
      <input
        type="number"
        min="0"
        step="any"
        bind:value={$borrowedUSDC}
        class="mt-1 block w-full border p-2 rounded"
      />
    </label>
  </div>

  <div class="space-y-1">
    <p>
      <strong>Live BTC Price:</strong>
      {#if $btcPrice !== null}
        ${$btcPrice.toFixed(2)}
      {:else}
        Loading…
      {/if}
    </p>
    <p>
      <strong>Loan-to-Value (LTV):</strong>
      {#if $ltv !== null}
        {$ltv.toFixed(2)} %
      {:else}
        N/A
      {/if}
    </p>
  </div>
</div>
