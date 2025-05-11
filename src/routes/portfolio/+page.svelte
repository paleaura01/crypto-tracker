<!-- src/routes/portfolio/+page.svelte -->
<script>
    import ExchangeBalances from './components/ExchangeBalances.svelte';
    import WalletBalances   from './components/WalletBalances.svelte';
    import LoanSummary      from './components/LoanSummary.svelte';
  
    export let data;
  </script>
  
  <ExchangeBalances accounts={data.exchangeAccounts} />
  <WalletBalances   accounts={data.walletAccounts}   />
  <LoanSummary      loan={data.loan}                 />
  