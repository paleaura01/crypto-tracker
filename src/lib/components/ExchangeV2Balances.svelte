<script lang="ts">
	import type { ExchangeV2Account } from '$lib/types/database';
	export let accounts: ExchangeV2Account[];
</script>

<h2 class="font-semibold">Exchange V2 balances</h2>
<table class="w-full text-sm">
	<tbody>
		{#each accounts as a}
			<tr>
				<td class="py-0.5">{a.currency}</td>
				<td class="py-0.5 text-right">{a.balance.value}</td>
			</tr>
		{/each}
	</tbody>
</table>
