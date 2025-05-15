<script lang="ts">
  import type { ExchangeV3Account } from '$lib/types/database';
  export let accounts: ExchangeV3Account[] = [];
</script>

<h2 class="font-semibold">Coinbase Advanced Trade</h2>
<table class="w-full text-sm">
  <thead>
    <tr>
      <th class="text-left py-1">Currency</th>
      <th class="text-right py-1">Balance</th>
    </tr>
  </thead>
  <tbody>
    {#each accounts as a}
      <tr class="border-b last:border-0">
        <td>{a.currency}</td>
        <td class="text-right">{a.balance.value}</td>
      </tr>
    {/each}
  </tbody>
</table>
