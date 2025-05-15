<script lang="ts">
	import type { WalletAccount } from '$lib/types/database';
	export let accounts: WalletAccount[];
</script>

<h2 class="font-semibold">Coinbase Wallet</h2>
<ul class="space-y-1">
	{#each accounts as w}
		<li class="flex justify-between text-sm">
			<span>{w.balance.currency}</span>
			<span>{w.balance.amount}</span>
		</li>
	{/each}
</ul>
