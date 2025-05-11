<script>
    export let accounts = [];
  </script>
  
  <h2>Your Wallet Balances</h2>
  {#if accounts.length === 0}
    <p><em>No on-chain balances found.</em></p>
  {:else}
    <ul>
      {#each accounts as a}
        {#if +a.balance.amount > 0}
          <li>{a.balance.currency}: {a.balance.amount}</li>
        {/if}
      {/each}
    </ul>
  {/if}
  