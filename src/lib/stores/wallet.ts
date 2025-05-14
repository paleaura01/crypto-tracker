import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { Connection } from '@solana/web3.js';
import { env } from '$env/dynamic/public';

export const walletStore = writable({
    connected: false,
    publicKey: null,
    balance: null,
    network: 'devnet'
});

export async function connectSolflare() {
    if (!browser) return false;

    try {
        if (!window.solflare) {
            window.open('https://solflare.com', '_blank');
            throw new Error('Please install Solflare wallet and refresh the page');
        }

        // Set wallet to devnet
        await window.solflare.connect();
        await window.solflare.request({ method: 'switchNetwork', params: { network: 'devnet' } });
        
        if (window.solflare.publicKey) {
            const publicKey = window.solflare.publicKey.toString();
            const connection = new Connection(env.PUBLIC_SOLANA_RPC_URL, 'confirmed');

            walletStore.set({
                connected: true,
                publicKey,
                balance: 0,
                network: 'devnet'
            });

            // Get balance
            try {
                const balance = await connection.getBalance(window.solflare.publicKey);
                walletStore.update(state => ({
                    ...state,
                    balance: balance / 1e9
                }));
            } catch (balanceError) {
                console.error('Error getting balance:', balanceError);
            }

            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Solflare connection error:', error);
        walletStore.set({
            connected: false,
            publicKey: null,
            balance: null,
            network: 'devnet'
        });
        throw error;
    }
}

export async function requestAirdrop() {
    if (!browser) return false;

    try {
        const connection = new Connection(env.PUBLIC_SOLANA_RPC_URL, 'confirmed');
        const airdropSignature = await connection.requestAirdrop(
            window.solflare.publicKey,
            2 * 1e9 // 2 SOL
        );

        // Wait for confirmation
        await connection.confirmTransaction(airdropSignature);

        // Update balance
        const balance = await connection.getBalance(window.solflare.publicKey);
        walletStore.update(state => ({
            ...state,
            balance: balance / 1e9
        }));

        return true;
    } catch (error) {
        console.error('Airdrop error:', error);
        throw error;
    }
}
