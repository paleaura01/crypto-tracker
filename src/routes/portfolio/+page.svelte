<script>
    export let data;
    const { details } = data;
  </script>
  
  <h1>Your Exchange Balances</h1>
  
  {#if details.length === 0}
    <p>No non‐zero balances.</p>
  {:else}
    <ul>
      {#each details as acct}
        {#if acct.error}
          <li>{acct.uuid}: error {acct.error}</li>
        {:else}
          <li><strong>{acct.currency}</strong>: {acct.available_balance.value}</li>
        {/if}
      {/each}
    </ul>
  {/if}
  
  <details>
    <summary>Debug: raw data</summary>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </details>
  