<script lang="ts">

	
	import ExchangeV2Balances from '$lib/components/ExchangeV2Balances.svelte';
	import ExchangeV3Balances from '$lib/components/ExchangeV3Balances.svelte';
	import CBWalletBalances   from '$lib/components/CBWalletBalances.svelte';
	import CBLoanSummary      from '$lib/components/CBLoanSummary.svelte';

	export let data: {
		exchangeV2: import('$lib/types/database').ExchangeV2Account[];
		exchangeV3: import('$lib/types/database').ExchangeV3Account[];
		wallet:     import('$lib/types/database').WalletAccount[];
		loans:      import('$lib/types/database').LoanData[];
	};
</script>
<div class="bg-green-500 text-white p-4 font-bold text-center mb-4">
  🎉 Tailwind is working! 🎉
</div>

<svelte:head>
	<title>Portfolio | Crypto Tracker</title>
</svelte:head>

<section class="p-4 space-y-6">
	<ExchangeV2Balances accounts={data.exchangeV2} />
	<ExchangeV3Balances accounts={data.exchangeV3} />
	<CBWalletBalances   accounts={data.wallet}      />
	<CBLoanSummary      loans={data.loans}          />
</section>
