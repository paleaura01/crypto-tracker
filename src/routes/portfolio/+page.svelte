<script lang="ts">
  import ExchangeConnect from './components/ExchangeConnect.svelte';
  import ExchangeV2Balances from './components/ExchangeV2Balances.svelte';
  import ExchangeV3Balances from './components/ExchangeV3Balances.svelte';
  import CBWalletBalances from './components/CBWalletBalances.svelte';
  import CBLoanSummary from './components/CBLoanSummary.svelte';

  import type {
    ExchangeV2Account,
    ExchangeV3Account,
    WalletAccount,
    LoanData
  } from '$lib/server/types';

  export let data: {
    hasCoinbaseKey: boolean;
    exchangeV2: ExchangeV2Account[];
    exchangeV3: ExchangeV3Account[];
    wallet: WalletAccount[];
    loans: LoanData[];
  };
</script>

<section class="p-4 space-y-8">
  <!-- Always show upload widget -->
  <ExchangeConnect />

  {#if data.hasCoinbaseKey}
    <!-- Show balances once key is present -->
    <ExchangeV2Balances accounts={data.exchangeV2} />
    <ExchangeV3Balances accounts={data.exchangeV3} />
    <CBWalletBalances accounts={data.wallet} />
    <CBLoanSummary loans={data.loans} />
  {:else}
    <!-- Prompt before upload -->
    <p class="text-center text-gray-600">
      Please upload your Coinbase API key above to load your balances and loans.
    </p>
  {/if}
</section>
