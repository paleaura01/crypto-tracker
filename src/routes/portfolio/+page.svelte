<script lang="ts">
  import CoinbaseExchange from './components/CoinbaseExchange.svelte';
  import CBWalletBalances from './components/CBWalletBalances.svelte';
  import CBLoanSummary from './components/CBLoanSummary.svelte';

  import type {
    ExchangeV2Account,
    ExchangeV3Account,
    WalletAccount,
    LoanData
  } from '$lib/server/types';

  export let data: {
    exchangeV2: ExchangeV2Account[];
    exchangeV3: ExchangeV3Account[];
    wallet: WalletAccount[];
    loans: LoanData[];
  };
</script>

<section class="p-4 space-y-8">
  <!-- Combined connect & balances -->
  <CoinbaseExchange
    exchangeV2={data.exchangeV2}
    exchangeV3={data.exchangeV3}
  />

  <!-- Remaining components -->
  <CBWalletBalances accounts={data.wallet} />
  <CBLoanSummary loans={data.loans} />
</section>
