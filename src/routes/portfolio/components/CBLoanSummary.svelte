<!-- src/routes/portfolio/components/CBLoanSummary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived, get } from 'svelte/store';
  import { btcPrice, startBtcTicker } from '$lib/stores/coinbasePrice';
  import type { LoanData } from '$lib/server/types';

  export let loans: LoanData[];

  // 1) Local input stores
  const collateralBTC = writable<number>(loans[0]?.collateral ?? 0);
  const borrowedUSDC  = writable<number>(loans[0]?.loanAmount ?? 0);

  // 2) Computed USD value of your BTC collateral
  const collateralValueUSD = derived(
    [collateralBTC, btcPrice],
    ([$c, $p]) => $p === null ? null : $c * $p
  );

  // 3) Computed LTV %
  const ltv = derived(
    [collateralBTC, borrowedUSDC, btcPrice],
    ([$c, $b, $p]) =>
      $p === null || $c <= 0
        ? null
        : ($b / ($c * $p)) * 100
  );

  // 4) Save only on blur
  async function saveLoan() {
    const payload = {
      collateral: get(collateralBTC),
      borrowed:   get(borrowedUSDC)
    };
    console.log('Saving on blur:', payload);
    await fetch('/api/loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  onMount(() => {
    startBtcTicker();
  });
</script>

<div class="   max-w-md  space-y-4">
  <h2 class="text-xl font-semibold">Manual Loan LTV Calculator</h2>

  <div class="grid grid-cols-2 gap-4">
    <!-- Collateral input -->
    <label class="flex flex-col">
      <span>Collateral (BTC)</span>
      <input
        type="number"
        min="0"
        step="any"
        bind:value={$collateralBTC}
        on:blur={saveLoan}
        class="mt-1 block w-full border p-2 rounded"
      />
    </label>

    <!-- Borrowed input -->
    <label class="flex flex-col">
      <span>Borrowed (USDC)</span>
      <input
        type="number"
        min="0"
        step="any"
        bind:value={$borrowedUSDC}
        on:blur={saveLoan}
        class="mt-1 block w-full border p-2 rounded"
      />
    </label>
  </div>

  <div class="space-y-1">
    <!-- Live BTC Price -->
    <p>
      <strong>Live BTC Price:</strong>
      {#if $btcPrice !== null}
        ${$btcPrice.toFixed(2)}
      {:else}
        Loading…
      {/if}
    </p>

    <!-- Collateral USD Value -->
    <p>
      <strong>Collateral (BTC) Price:</strong>
      {#if $collateralValueUSD !== null}
        ${$collateralValueUSD.toFixed(2)}
      {:else}
        –
      {/if}
    </p>

    <!-- LTV % -->
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
