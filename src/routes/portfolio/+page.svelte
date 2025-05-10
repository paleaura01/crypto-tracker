<script>
  import { onMount } from 'svelte';

  let accounts = [];
  let loading  = false;
  let error    = '';

  async function loadAll() {
    loading = true;
    error   = '';
    try {
      // 1) Fetch the shortlist of non-zero UUIDs
      const listRes = await fetch('/api/cb/balances');
      if (!listRes.ok) {
        const err = await listRes.json().catch(() => ({}));
        throw new Error(err.error || listRes.statusText);
      }
      const list = await listRes.json(); 
      // [{ uuid, currency, amount }, …]

      // 2) For each, fetch the full account details
      const detailed = await Promise.all(
        list.map(item =>
          fetch(`/api/cb/account/${item.uuid}`)
            .then(r => {
              if (!r.ok) throw new Error(`acct ${item.uuid} failed`);
              return r.json();
            })
            .then(full => ({
              uuid:      full.uuid,
              currency:  full.currency,
              balance:   full.available_balance.value,
              name:      full.name
            }))
        )
      );

      accounts = detailed;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(loadAll);
</script>

<button on:click={loadAll} disabled={loading}>
  {#if loading}Loading…{:else}Load Balances{/if}
</button>

{#if error}
  <p style="color:red">{error}</p>
{:else if !loading && accounts.length === 0}
  <p>No non-zero balances found.</p>
{:else}
  <ul>
    {#each accounts as a}
      <li>
        <strong>{a.currency}</strong> ({a.name}): {a.balance}
      </li>
    {/each}
  </ul>
{/if}
