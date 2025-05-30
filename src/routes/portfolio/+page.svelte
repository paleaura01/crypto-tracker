<script lang="ts">
  // Use components from the centralized lib structure
  import { EVMAddressBalances, CBExchangeBalances, CBLoanSummary } from '$lib/components';

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
  
  <CBExchangeBalances
    wallets={wallet}
    exchangeV3={exchangeV3}
  />
</section>
