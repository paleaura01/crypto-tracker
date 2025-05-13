<script lang="ts">
  import type { LoanData } from '$lib/server/types';

  export let loans: LoanData[] = [];
</script>

<div class="mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Loans</h2>
  {#if loans.length}
    <ul class="list-disc pl-5">
      {#each loans as loan, idx (`loan-${loan.id ?? idx}`)}
        <li>
          Collateral: {loan.collateral} — Loan: {loan.loanAmount}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No active loans.</p>
  {/if}
</div>
