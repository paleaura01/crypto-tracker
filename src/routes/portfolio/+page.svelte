<script lang="ts">
    import type { PageData } from './$types';
    import ExchangeV2Balances from './components/ExchangeV2Balances.svelte';
    import ExchangeV3Balances from './components/ExchangeV3Balances.svelte';
    import CBWalletBalances   from './components/CBWalletBalances.svelte';
    import CBLoanSummary      from './components/CBLoanSummary.svelte';
  
    export let data: PageData;
  </script>
  
  <ExchangeV2Balances accounts={data.exchangeAccountsV2} />
  <ExchangeV3Balances accounts={data.exchangeAccountsV3} />
  <CBWalletBalances   accounts={data.walletAccounts} />
  <CBLoanSummary      loan={data.loan}             />
  