<script lang="ts">
	import type { LoanData } from '$lib/types/database';
	export let loans: LoanData[];
</script>

<h2 class="font-semibold">Loan summary</h2>

{#if loans.length === 0}
	<p class="text-sm italic">No active loans.</p>
{:else}
	<table class="w-full text-sm">
		<thead><tr><th>Collateral</th><th>Loan</th></tr></thead>
		<tbody>
			{#each loans as l}
				<tr><td>{l.collateral}</td><td>{l.loanAmount}</td></tr>
			{/each}
		</tbody>
	</table>
{/if}
