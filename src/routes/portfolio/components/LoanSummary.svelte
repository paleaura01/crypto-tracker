<script>
    export let loan = null;
  </script>
  
  <h2>Your Collateralized Loan</h2>
  {#if loan}
    <p>
      {loan.pair} – {loan.ltv}% LTV – {loan.liquidation} Liquidation price –  
      {loan.collateral} {loan.baseAsset} / {loan.debt} {loan.quoteAsset} @ {loan.apr}% APR
    </p>
  {:else}
    <p><em>No active loans.</em></p>
  {/if}
  