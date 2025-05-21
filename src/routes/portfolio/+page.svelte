<script lang="ts">
  import CoinbaseExchange from './components/CoinbaseExchange.svelte';
  import CBWalletBalances from './components/CBWalletBalances.svelte';
  import CBLoanSummary from './components/CBLoanSummary.svelte';

  import type {
    WalletAccount,
    ExchangeV3Account,
    LoanData
  } from '$lib/server/types';

  export let data: {
    wallet: WalletAccount[];
    exchangeV3: ExchangeV3Account[];
    loans: LoanData[];
  };

  const { wallet, exchangeV3, loans } = data;
</script>

<section class="p-4 space-y-8">
  <CoinbaseExchange
    wallets={wallet}
    exchangeV3={exchangeV3}
  />

  <CBWalletBalances wallets={wallet} />

  <CBLoanSummary loans={loans} />
</section>
