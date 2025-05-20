<script lang="ts">
    interface PortfolioItem {
      chain: string;
      symbol: string;
      balance: number;
      price: number;
      totalValue: number;
    }
  
    export let accounts: PortfolioItem[] = [];
  
    // only show ones with a real USD price
    $: shown = accounts.filter(a => a.price > 0);
  </script>
  
  <div class="section dark:text-white">
    <h2>On-Chain Balances</h2>
  
    {#if shown.length}
      <ul>
        {#each shown as asset (asset.chain + '-' + asset.symbol)}
          <li>
            <strong>{asset.chain}</strong>: {asset.symbol} – 
            {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} × 
            ${asset.price.toFixed(2)} = 
            <strong>${asset.totalValue.toFixed(2)}</strong>
          </li>
        {/each}
      </ul>
    {:else}
      <p>No on-chain assets found that CoinGecko prices.</p>
    {/if}
  </div>
  