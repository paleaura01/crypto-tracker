<script lang="ts">
  export let data: { transactions: any[] };
</script>

<svelte:head><title>Transactions | Crypto Tracker</title></svelte:head>

<section class="p-4">
  <h1 class="text-2xl font-bold mb-4">Transactions</h1>

  {#if data.transactions.length}
    <table class="w-full text-sm border-collapse">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-2 text-left">Date</th>
          <th class="p-2 text-left">Type</th>
          <th class="p-2 text-left">Amount</th>
          <th class="p-2 text-left">Currency</th>
        </tr>
      </thead>
      <tbody>
        {#each data.transactions as tx}
          <tr class="border-b">
            <td class="p-2">{new Date(tx.timestamp).toLocaleString()}</td>
            <td class="p-2">{tx.type}</td>
            <td class="p-2">{tx.amount}</td>
            <td class="p-2">{tx.currency}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="italic">No transactions recorded yet.</p>
  {/if}
</section>
