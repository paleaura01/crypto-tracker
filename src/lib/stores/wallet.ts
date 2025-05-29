// src/lib/stores/wallet.ts

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { env } from '$env/dynamic/public';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
  network: 'devnet';
}

export const walletStore = writable<WalletState>({
  connected: false,
  publicKey: null,
  balance: null,
  network: 'devnet'
});

/** 
 * Strip wrapping quotes and fix the "/?api-key" → "?api-key" issue 
 */
function sanitizeRpcUrl(raw: string): string {
  let url = raw;
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1);
  }
  return url.replace(/\/\?/, '?');
}

const RPC_URL = sanitizeRpcUrl(env.PUBLIC_SOLANA_RPC_URL);

/** Quick ping to verify your key & endpoint */
export async function testRPCConnection(): Promise<boolean> {
  try {
    const conn = new Connection(RPC_URL, 'confirmed');
    await conn.getVersion();
    return true;
  } catch {
    return false;
  }
}

/** Connect Solflare, switch to devnet, fetch & store balance */
export async function connectSolflare(): Promise<boolean> {
  if (!browser) return false;

  if (!window.solflare) {
    window.open('https://solflare.com', '_blank');
    throw new Error('Please install the Solflare wallet and refresh the page');
  }

  try {
    await window.solflare.connect();
    await window.solflare.request({ method: 'switchNetwork', params: { network: 'devnet' } });

    const pk = window.solflare.publicKey!;
    const publicKey = pk.toString();

    const conn = new Connection(RPC_URL, 'confirmed');

    walletStore.set({
      connected: true,
      publicKey,
      balance: null,
      network: 'devnet'
    });

    const raw = await conn.getBalance(pk);
    walletStore.update(s => ({ ...s, balance: raw / LAMPORTS_PER_SOL }));

    return true;
  } catch {
    walletStore.set({
      connected: false,
      publicKey: null,
      balance: null,
      network: 'devnet'
    });
    throw new Error('Solflare connection failed');
  }
}

/** Request a 2 SOL airdrop and update balance */
export async function requestAirdrop(): Promise<boolean> {
  if (!browser || !window.solflare?.publicKey) return false;

  try {
    const conn = new Connection(RPC_URL, 'confirmed');
    const sig = await conn.requestAirdrop(window.solflare.publicKey, 2 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);

    const raw = await conn.getBalance(window.solflare.publicKey);
    walletStore.update(s => ({ ...s, balance: raw / LAMPORTS_PER_SOL }));
    return true;
  } catch {
    return false;
  }
}
