<script lang="ts">
  import CoinbaseExchange from './components/CBExchangeBalances.svelte';
  import CBLoanSummary from './components/CBLoanSummary.svelte';
  import EVMAddressBalances from './components/EVMAddressBalances.svelte';

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
    <!-- Your on-chain one-off balances via Moralis -->
  <EVMAddressBalances />
  <CBLoanSummary loans={loans} />
  <CoinbaseExchange
    wallets={wallet}
    exchangeV3={exchangeV3}
  />

  
</section>
