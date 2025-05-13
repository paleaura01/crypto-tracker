<script lang="ts">
    import ExchangeV2Balances from './components/ExchangeV2Balances.svelte';
    import ExchangeV3Balances from './components/ExchangeV3Balances.svelte';
    import CBWalletBalances from './components/CBWalletBalances.svelte';
    import CBLoanSummary from './components/CBLoanSummary.svelte';
  
    // these types just help the IDE/autocomplete— they come from +page.server.ts
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
  
  <section class="p-4">
    <ExchangeV2Balances accounts={data.exchangeV2} />
    <ExchangeV3Balances accounts={data.exchangeV3} />
    <CBWalletBalances accounts={data.wallet} />
    <CBLoanSummary loans={data.loans} />
  </section>
  