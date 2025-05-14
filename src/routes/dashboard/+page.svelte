<script lang="ts">
  export let data: { items: any[] };
</script>

<h1>Dashboard</h1>
{#each data.items as item}
  <pre>{JSON.stringify(item, null, 2)}</pre>
{/each}
