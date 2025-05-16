/// <reference types="@sveltejs/kit" />
import type { PublicKey } from '@solana/web3.js';

declare global {
  interface Window {
    solflare?: {
      publicKey: PublicKey;
      connect(): Promise<void>;
      request(args: { method: string; params?: any }): Promise<void>;
      signTransaction(tx: any): Promise<any>;
    };
  }
}

// this file needs at least one import/export to be a module
export {};
