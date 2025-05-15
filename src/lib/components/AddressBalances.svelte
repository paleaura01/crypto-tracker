<script lang="ts">
	export let accounts: { address: string; balance: string }[];
</script>

<h2 class="font-semibold">On-chain addresses</h2>
<ul class="space-y-1">
	{#each accounts as acct}
		<li class="flex justify-between text-sm">
			<span class="font-mono">{acct.address}</span>
			<span>{acct.balance}</span>
		</li>
	{/each}
</ul>
