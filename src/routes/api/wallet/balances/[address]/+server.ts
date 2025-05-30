// src/routes/api/wallet/balances/[address]/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json, error as kitError } from '@sveltejs/kit';

// Types for the expected response format
interface TokenBalance {
  symbol: string;
  balance: string;
  contract_address: string;
  chain: string;
  token_address: string;
  decimals: number;
}

interface MoralisTokenResponse {
  symbol: string;
  balance: number;
  contract_address: string;
  chain: string;
}

interface MoralisApiResponse {
  balances: MoralisTokenResponse[];
}

// Check if address is an Ethereum address (starts with 0x and is 42 characters long)
function isEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Check if address is a Solana address (base58, 32-44 characters)
function isSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export const GET: RequestHandler<{ address: string }> = async ({ params, fetch }) => {
  const address = params.address;

  try {
    // Route to appropriate handler based on address format
    if (isEthereumAddress(address)) {
      // Handle EVM address (Ethereum, Polygon, BSC, etc.)
      return await handleEVMAddress(address, fetch);
    } else if (isSolanaAddress(address)) {
      // Handle Solana address
      return await handleSolanaAddress(address, fetch);
    } else {
      throw kitError(400, 'Invalid address format. Must be Ethereum (0x...) or Solana format.');
    }
  } catch (err) {
    throw kitError(500, err instanceof Error ? err.message : 'Failed to fetch wallet balances');
  }
};

async function handleEVMAddress(address: string, fetch: typeof globalThis.fetch) {
  try {
    // Use the existing Moralis endpoint for multi-chain EVM balances
    const response = await fetch(`/api/wallet/wallet-address/moralis?address=${address}`);
    
    if (!response.ok) {
      // If Moralis fails, return empty balances for now
      // In production, you could add other providers like Alchemy as fallback
      return json([]);
    }

    const data = await response.json() as MoralisApiResponse;
    
    // Transform Moralis response to the format expected by EVMAddressBalances.svelte
    const transformedBalances: TokenBalance[] = data.balances?.map((token: MoralisTokenResponse) => ({
      symbol: token.symbol,
      balance: token.balance.toString(),
      contract_address: token.contract_address,
      chain: token.chain, // 'eth', 'polygon', 'bsc', etc.
      token_address: token.contract_address,
      decimals: 18 // Default, would be better to get from token metadata
    })) || [];

    return json(transformedBalances);
  } catch {
    // Return empty array if there's any error fetching balances
    // This prevents the whole app from breaking
    return json([]);
  }
}

async function handleSolanaAddress(address: string, fetch: typeof globalThis.fetch) {
  // Keep the existing Solana logic for now
  const { PUBLIC_SOLANA_RPC_URL } = await import('$env/static/public');
  
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

  interface SolanaRpcResponse {
    jsonrpc: string;
    id: number;
    result?: {
      context: { slot: number };
      value: number;
    };
    error?: { code: number; message: string };
  }

  const rpc = await res.json() as SolanaRpcResponse;
  if (rpc.error) {
    throw kitError(502, `RPC error ${rpc.error.code}: ${rpc.error.message}`);
  }
  if (!rpc.result || typeof rpc.result.value !== 'number') {
    throw kitError(502, 'Invalid RPC response');
  }

  // Transform Solana balance to match expected format
  const solBalance: TokenBalance[] = [{
    symbol: 'SOL',
    balance: (rpc.result.value / 1e9).toString(), // Convert lamports to SOL
    contract_address: '',
    chain: 'solana',
    token_address: '',
    decimals: 9
  }];

  return json(solBalance);
}
