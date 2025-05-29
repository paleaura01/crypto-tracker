// src/lib/server/coingecko-server.ts
export async function getSolanaPrice(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
  );
  if (!res.ok) throw new Error(`Coingecko HTTP ${res.status}`);
  const json = await res.json();
  return json.solana?.usd ?? 0;
}
