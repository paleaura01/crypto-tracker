<!-- Test page for EVMAddressBalances component without authentication -->
<script lang="ts">
  import EVMAddressBalances from '../portfolio/components/EVMAddressBalances.svelte';
</script>

<svelte:head>
  <title>Test EVM Address Balances</title>
</svelte:head>

<section class="p-4">
  <h1 class="text-2xl font-bold mb-4">Test EVM Address Balances</h1>
  <p class="text-gray-600 mb-4">This is a test page to debug the BNB symbol override issue without authentication.</p>
  
  <EVMAddressBalances />
</section>
