<script>
  export let accounts = [];
</script>

<h2>Your Exchange Balances</h2>
<ul>
  {#each accounts as a}
    {#if +a.available_balance.value > 0}
      <li>{a.currency}: {a.available_balance.value}</li>
    {/if}
  {/each}
</ul>
