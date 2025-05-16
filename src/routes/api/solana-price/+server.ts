// src/routes/api/solana-price/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { getSolanaPrice } from '$lib/server/coingecko-server';

export const GET: RequestHandler = async () => {
  try {
    const price = await getSolanaPrice();
    return new Response(JSON.stringify({ price }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch SOL price' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
