<script lang="ts">
    let address   = '';
    let loading   = false;
    let error     = '';
    let portfolio: {
      chain: string;
      symbol: string;
      balance: number;
      price: number;
      totalValue: number;
    }[] = [];
  
    async function loadAll() {
      if (!address) {
        error = 'Enter a wallet address';
        return;
      }
      loading = true;
      error   = '';
      try {
        const res = await fetch(`/api/combined-portfolio?address=${encodeURIComponent(address)}`);
        if (!res.ok) throw new Error(await res.text());
        portfolio = await res.json();
      } catch (e: any) {
        console.error(e);
        error = 'Could not load portfolio';
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div>
    <input bind:value={address} placeholder="0x… or Solana address" />
    <button on:click={loadAll} disabled={loading}>
      {#if loading}Loading…{:else}Load All Balances{/if}
    </button>
  </div>
  
  {#if error}
    <p class="error">Error: {error}</p>
  {:else if portfolio.length}
    <ul>
      {#each portfolio as { chain, symbol, balance, price, totalValue }}
        <li>
          <strong>{symbol}</strong> on {chain}: {balance}
          @ ${price} → $ {totalValue}
        </li>
      {/each}
    </ul>
  {:else if !loading}
    <p>No tokens found or zero balances.</p>
  {/if}
  