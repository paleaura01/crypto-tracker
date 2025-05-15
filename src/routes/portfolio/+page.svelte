<script lang="ts">
  import type {
    ExchangeV2Account,
    ExchangeV3Account,
    WalletAccount,
    LoanData
  } from '$lib/types/database';

  import CoinbaseAdvancedTradeBalances from '$lib/components/CoinbaseAdvancedTradeBalances.svelte';
  import CoinbaseAccountBalances      from '$lib/components/CoinbaseAccountBalances.svelte';
  import CoinbaseCustodialWallet      from '$lib/components/CoinbaseCustodialWallet.svelte';
  import CBLoanSummary                from '$lib/components/CBLoanSummary.svelte';

  export let data: {
    v2:     ExchangeV2Account[];
    v3:     ExchangeV3Account[];
    wallet: WalletAccount[];
    loans:  LoanData[];
  };
</script>

<section class="p-4 space-y-8">
  <CoinbaseAdvancedTradeBalances accounts={data.v2} />
  <CoinbaseAccountBalances      accounts={data.v3} />
  <CoinbaseCustodialWallet />
  <CBLoanSummary loans={data.loans} />
</section>
