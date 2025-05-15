<script lang="ts">
	export let data: { stats: any[] };
</script>

<h2 class="text-xl font-semibold mb-3">Site stats</h2>
<pre class="bg-gray-100 p-3 rounded text-xs">{JSON.stringify(data.stats, null, 2)}</pre>
