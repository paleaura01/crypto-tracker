<script lang="ts">
  import type { ExchangeV3Account } from '$lib/types/database';
  export let accounts: ExchangeV3Account[] = [];
</script>

<h2 class="font-semibold">Exchange V3 balances</h2>
<table class="w-full text-sm">
  <tbody>
    {#each accounts as a}
      <tr>
        <td>{a.currency}</td>
        <td class="text-right">{a.balance.value ?? (a.balance as any).amount}</td>
      </tr>
    {/each}
  </tbody>
</table>
