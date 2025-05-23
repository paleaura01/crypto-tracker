<!-- src/routes/portfolio/+page.svelte -->
<script lang="ts">
  import CoinbaseExchange  from './components/CoinbaseExchange.svelte';
  import CBWalletBalances  from './components/CBWalletBalances.svelte';
  import CBLoanSummary     from './components/CBLoanSummary.svelte';

  import type {
    ExchangeV3Account,
    WalletAccount,
    LoanData
  } from '$lib/server/types';

  // Only the props your loader returns and your components expect
  export let data: {
    exchangeV3: ExchangeV3Account[];
    wallet: WalletAccount[];
    loans: LoanData[];
  };

  const { exchangeV3, wallet, loans } = data;
</script>

<section class="p-4 space-y-8">
    <CBLoanSummary
    loans={loans}
  />
  <CoinbaseExchange
    exchangeV3={exchangeV3}
    wallets={wallet}
  />

  <CBWalletBalances
    wallets={wallet}
  />


</section>
