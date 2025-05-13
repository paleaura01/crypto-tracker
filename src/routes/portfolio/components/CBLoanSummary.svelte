<script lang="ts">
  import type { LoanSummary } from '../lib/cbloans';  // ← use cbloans.ts here
  export let loan: LoanSummary | null = null;
</script>

<h2>Your Loan Summary</h2>
{#if loan}
  <!-- render your loan fields here -->
  <pre>{JSON.stringify(loan, null, 2)}</pre>
{:else}
  <p><em>No loan data available yet.</em></p>
{/if}
