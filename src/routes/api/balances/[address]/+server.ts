// src/routes/api/balances/[address]/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json, error as kitError } from '@sveltejs/kit';
import { PUBLIC_SOLANA_RPC_URL } from '$env/static/public';

interface RpcResponse {
  jsonrpc: string;
  id: number;
  result?: {
    context: { slot: number };
    value: number;
  };
  error?: { code: number; message: string };
}

export const GET: RequestHandler<{ address: string }> = async ({ params }) => {
  const address = params.address;

  const rpcPayload = {
    jsonrpc: '2.0' as const,
    id: 1,
    method: 'getBalance' as const,
    params: [address]
  };

  const res = await fetch(PUBLIC_SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rpcPayload)
  });

  if (!res.ok) {
    throw kitError(res.status, `RPC error: ${res.statusText}`);
  }

  const rpc: RpcResponse = await res.json();
  if (rpc.error) {
    throw kitError(502, `RPC error ${rpc.error.code}: ${rpc.error.message}`);
  }
  if (!rpc.result || typeof rpc.result.value !== 'number') {
    throw kitError(502, 'Invalid RPC response');
  }

  return json({ balance: rpc.result.value });
};
