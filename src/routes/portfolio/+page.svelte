<script>
    export let data;
  </script>
  
  <h2>Your Exchange Balances</h2>
  <ul>
    {#each data.exchangeAccounts as acct}
      {#if +acct.available_balance.value > 0}
        <li>{acct.currency}: {acct.available_balance.value}</li>
      {/if}
    {/each}
  </ul>
  
  <h2>Your Wallet Balances</h2>
  <ul>
    {#each data.walletAccounts as acct}
      {#if +acct.balance.amount > 0}
        <li>{acct.balance.currency}: {acct.balance.amount}</li>
      {/if}
    {/each}
  </ul>
  