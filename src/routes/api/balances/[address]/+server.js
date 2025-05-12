// src/routes/api/balances/[address]/+server.ts
import { json, error } from '@sveltejs/kit';
import { PUBLIC_SOLANA_RPC_URL } from '$env/static/public';

export async function GET({ params }) {
  const address = params.address;

  // Build JSON-RPC request for getBalance
  const rpcPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getBalance',
    params: [address]
  };

  // Send to Helius/RPC endpoint
  const res = await fetch(PUBLIC_SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rpcPayload)
  });
  if (!res.ok) {
    throw error(res.status, `RPC error: ${res.statusText}`);
  }

  const { result } = await res.json();
  if (!result || typeof result.value !== 'number') {
    throw error(502, 'Invalid RPC response');
  }

  // Return lamports directly; conversion to SOL happens client-side if desired
  return json({ balance: result.value });
}
