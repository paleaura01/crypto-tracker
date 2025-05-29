<script lang="ts">
    import { onMount } from 'svelte';
    import { walletStore, connectSolflare } from '$lib/stores/wallet';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import { env } from '$env/dynamic/public';
    import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

    let loading = false;
    let error: string | null = null;
    let solanaPrice = 0;
    let solanaAmount = 0;
    const PAYMENT_AMOUNT_USD = 5; // $5 USD
    const RECIPIENT_ADDRESS = '9XAM8pJMk4fFMkuuQw5Jt15YyhtLoDBp93NTg5T4hhU2';
    
    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            goto('/auth/login');
        }
        try {
            const response = await fetch('/api/crypto/solana-price');
            const { price } = await response.json();
            solanaPrice = price;
            solanaAmount = PAYMENT_AMOUNT_USD / solanaPrice;
        } catch {
            error = 'Failed to fetch Solana price';
        }
    });

    async function handleWalletConnection() {
      try {
          loading = true;
          await connectSolflare();
      } catch (err) {
          error = err.message;
      } finally {
          loading = false;
      }
    }

    async function handlePayment() {
        try {
            loading = true;        if (!$walletStore.connected || !$walletStore.publicKey) {
            throw new Error('Please connect your wallet first');
        }

        const connection = new Connection(env.PUBLIC_SOLANA_RPC_URL);
        const recipientPubKey = new PublicKey(RECIPIENT_ADDRESS);
        const lamports = Math.floor(solanaAmount * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey($walletStore.publicKey),
                toPubkey: recipientPubKey,
                lamports,
            })
        );

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey($walletStore.publicKey);

        if (!window.solflare) {
            throw new Error('Solflare wallet not found');
        }
        const signedTransaction = await window.solflare.signTransaction(transaction) as { serialize: () => Uint8Array };
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(signature);

            // Update user payment status in Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase
                    .from('user_payments')
                    .upsert({
                        user_id: session.user.id,
                        status: 'active',
                        amount: PAYMENT_AMOUNT_USD,
                        transaction_signature: signature
                    });
            }

            goto('/dashboard');
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="payment-container">
    <h1>Complete Payment</h1>
    <p>Connect your wallet and send {solanaAmount.toFixed(4)} SOL to access the full features.</p>

    <div class="wallet-section">
        <button 
            on:click={handleWalletConnection}
            disabled={loading}
            class="wallet-button"
        >        {#if $walletStore.connected && $walletStore.publicKey}
            Disconnect Wallet ({$walletStore.publicKey.slice(0, 4)}...{$walletStore.publicKey.slice(-4)})
        {:else}
            Connect Solflare Wallet
        {/if}
        </button>
        
        {#if $walletStore.connected}
            <p class="balance">Balance: {$walletStore.balance} SOL</p>
            
            <button 
                on:click={handlePayment}
                disabled={loading}
                class="payment-button"
            >
                {loading ? 'Processing...' : 'Complete Payment'}
            </button>
        {/if}
    </div>

    {#if error}
        <p class="error">{error}</p>
    {/if}
</div>

<style>
    .payment-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
    }

    .wallet-section {
        margin: 2rem 0;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
    }

    .wallet-button {
        background: #9945FF;
        color: white;
        padding: 0.8rem 1.6rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        width: 100%;
    }

    .payment-button {
        background: #14F195;
        color: black;
        padding: 0.8rem 1.6rem;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        width: 100%;
        margin-top: 1rem;
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .balance {
        margin: 1rem 0;
        font-size: 0.9rem;
        color: #666;
    }

    .error {
        color: #dc2626;
        margin-top: 1rem;
    }
</style>
