<!-- src/routes/auth/signup/+page.svelte -->
<svelte:head>
  <title>Sign Up | Crypto Tracker</title>
</svelte:head>

<script>
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { walletStore, connectSolflare, requestAirdrop } from '$lib/stores/wallet';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import {
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram
  } from '@solana/web3.js';

  let email = '';
  let password = '';
  let loading = false;
  let message = '';
  let solanaPrice = 0;
  let solanaAmount = 0;
  let selectedPlan = 'monthly'; // default to monthly plan

  const MONTHLY_AMOUNT_USD = 5;
  const LIFETIME_AMOUNT_USD = 50;
  const RECIPIENT_ADDRESS = 'BfzKVGt4WJLBcDbkyzX4Yn1VcAwbk7bF8xohJDHzMGVX';

  $: paymentAmount = selectedPlan === 'monthly' ? MONTHLY_AMOUNT_USD : LIFETIME_AMOUNT_USD;
  $: solanaAmount = paymentAmount / solanaPrice;

  onMount(async () => {
    try {
      const response = await fetch('/api/solana-price');
      const { price } = await response.json();
      solanaPrice = price;
      solanaAmount = paymentAmount / solanaPrice;
      const isConnected = await testRPCConnection();
      if (!isConnected) {
        message = 'Failed to connect to Solana network';
      }
    } catch (err) {
      message = 'Failed to fetch Solana price';
    }
  });

  async function handleConnectWallet() {
    try {
      loading = true;
      await connectSolflare();
      message = 'Wallet connected successfully!';
    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }

  async function handleSignUp() {
    try {
        loading = true;
        if (!$walletStore.connected) {
            throw new Error('Please connect your wallet first');
        }

        console.log('Creating connection...');
        const connection = new Connection(env.PUBLIC_SOLANA_RPC_URL, 'confirmed');
        const recipientPubKey = new PublicKey(RECIPIENT_ADDRESS);
        const lamports = Math.floor(solanaAmount * LAMPORTS_PER_SOL);

        console.log('Getting latest blockhash...');
        let blockhashObj;
        try {
            blockhashObj = await connection.getLatestBlockhash('finalized');
            console.log('Blockhash:', blockhashObj.blockhash);
        } catch (err) {
            console.error('Error getting blockhash:', err);
            throw new Error(`Failed to get blockhash: ${err.message}`);
        }

        console.log('Creating payment transaction...');
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey($walletStore.publicKey),
                toPubkey: recipientPubKey,
                lamports,
            })
        );
        transaction.recentBlockhash = blockhashObj.blockhash;
        transaction.feePayer = new PublicKey($walletStore.publicKey);

        console.log('Requesting signature...');
        let signedTransaction;
        try {
            signedTransaction = await window.solflare.signTransaction(transaction);
            console.log('Transaction signed successfully');
        } catch (err) {
            console.error('Error signing transaction:', err);
            throw new Error(`Transaction signing failed: ${err.message}`);
        }

        let signature;
        try {
            signature = await connection.sendRawTransaction(signedTransaction.serialize());
            console.log('Transaction sent:', signature);
        } catch (err) {
            if (err.message && err.message.includes('already been processed')) {
                console.warn('Transaction already processed, attempting to retrieve logs...');
                if (err.signature) {
                    const logs = await connection.getLogs(err.signature);
                    console.log('Transaction logs:', logs);
                    signature = err.signature;
                } else {
                    console.error('No signature found in error, cannot get logs.');
                    throw err;
                }
            } else {
                console.error('Send transaction error:', err);
                throw new Error(`Transaction failed: ${err.message}`);
            }
        }

        console.log('Awaiting payment confirmation...');
        const confirmation = await connection.confirmTransaction(signature);
        console.log('Payment confirmation:', confirmation);
        if (confirmation.value.err) {
            throw new Error('Payment transaction failed to confirm');
        }

        console.log('Payment confirmed, creating user account...');
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (signupError) {
            console.error('Signup error:', signupError);
            throw new Error(signupError.message);
        }

        let userId = signupData?.user?.id;
        if (!userId) {
            console.log('User ID not found in signup data, fetching user...');
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error('Error fetching user:', userError);
                throw new Error(userError.message);
            }
            userId = userData?.user?.id;
        }

        if (userId) {
            console.log('Creating payment record...');
            const currentPaymentAmount = selectedPlan === 'monthly' ? MONTHLY_AMOUNT_USD : LIFETIME_AMOUNT_USD;
            try {
                const res = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        amount: currentPaymentAmount,
                        transaction_signature: signature,
                        plan: selectedPlan,
                        payment_address: RECIPIENT_ADDRESS,
                        status: 'active'
                    })
                });
                
                const paymentResult = await res.json();
                if (paymentResult.error) {
                    console.error('Payment record creation error:', paymentResult.error);
                    throw new Error(paymentResult.error);
                }
                console.log('Payment record created:', paymentResult);

                console.log('Getting session for cookie...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('Session error:', sessionError);
                    throw sessionError;
                }

                console.log('Setting session cookie...');
                const res2 = await fetch('/api/set-session-cookie', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ session })
                });

                if (!res2.ok) {
                    const errData = await res2.json();
                    console.error('Cookie setting error:', errData);
                    throw new Error(errData.error || 'Failed to set session cookie');
                }

                // Wait for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 100));

                message = `Payment confirmed. Thank you for signing up with the ${
                    selectedPlan === 'monthly' ? 'Monthly (30 days)' : 'Lifetime'
                } plan!`;
                
                console.log('Signup complete, redirecting to dashboard...');
                window.location.href = '/dashboard';
            } catch (err) {
                console.error('Payment record creation error:', err);
                throw new Error(`Failed to create payment record: ${err.message}`);
            }
        } else {
            throw new Error('Failed to retrieve user information.');
        }
    } catch (error) {
        console.error('Overall signup error:', error);
        message = error.message;
    } finally {
        loading = false;
    }
}
</script>

<h1>Sign Up</h1>

<form on:submit|preventDefault={handleSignUp}>
  <input
    type="email"
    bind:value={email}
    placeholder="Email"
    autocomplete="email"
    required
    style="display: block; margin-bottom: 1rem;"
  />
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    autocomplete="new-password"
    required
    style="display: block; margin-bottom: 1rem;"
  />

  <div class="subscription-options">
    <h3>Choose your plan:</h3>
    <div class="radio-option">
      <input
        type="radio"
        id="monthly"
        name="plan"
        value="monthly"
        bind:group={selectedPlan}
      >
      <label for="monthly">
        <span class="plan-title">Monthly Plan</span>
        <span class="plan-price">$5/30days (≈ {(MONTHLY_AMOUNT_USD / solanaPrice).toFixed(4)} SOL)</span>
      </label>
    </div>
    <div class="radio-option">
      <input
        type="radio"
        id="lifetime"
        name="plan"
        value="lifetime"
        bind:group={selectedPlan}
      >
      <label for="lifetime">
        <span class="plan-title">Lifetime Access</span>
        <span class="plan-price">${LIFETIME_AMOUNT_USD} one-time payment (≈ {(LIFETIME_AMOUNT_USD / solanaPrice).toFixed(4)} SOL)</span>
      </label>
    </div>
  </div>

  <button
    type="button"
    on:click={handleConnectWallet}
    disabled={loading}
    class="wallet-button"
  >
    {#if $walletStore.connected}
      Connected: {$walletStore.publicKey.slice(0, 4)}...{$walletStore.publicKey.slice(-4)}
    {:else}
      Connect Solflare Wallet
    {/if}
  </button>

  {#if $walletStore.connected}
    <p class="balance">Balance: {$walletStore.balance} SOL</p>
    <button
      type="button"
      on:click={() => requestAirdrop()}
      class="airdrop-button"
      disabled={loading}
    >
      Request Devnet SOL
    </button>
  {/if}

  <button
    type="submit"
    class="signup-button"
    disabled={loading || !$walletStore.connected}
    style="opacity: {$walletStore.connected ? '1' : '0.5'}"
  >
    {loading ? 'Loading...' : 'Subscribe & Sign Up'}
  </button>
</form>

<p class="message">{message}</p>

<style>
  .wallet-button {
    background: #9945FF;
    color: white;
    padding: 0.8rem 1.6rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    width: 100%;
    margin-bottom: 1rem;
  }
  .wallet-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .airdrop-button {
    width: 100%;
    padding: 0.8rem;
    background: #9945FF;
    color: white;
    border: none;
    border-radius: 4px;
    margin: 0.5rem 0;
    cursor: pointer;
  }
  .airdrop-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .signup-button {
    width: 100%;
    padding: 0.8rem;
    background: #14F195;
    color: black;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.3s ease;
  }
  .signup-button:disabled {
    cursor: not-allowed;
  }
  .balance {
    margin: 0.5rem 0 1rem 0;
    font-size: 0.9rem;
    color: #666;
  }
  .message {
    margin-top: 1rem;
    color: #666;
  }
  .subscription-options {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
  }
  .subscription-options h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
  .radio-option {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .radio-option:hover {
    background-color: #eaeaea;
  }
  .radio-option input[type="radio"] {
    margin-top: 0.25rem;
    margin-right: 0.75rem;
    cursor: pointer;
  }
  .radio-option label {
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }
  .plan-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  .plan-price {
    font-size: 0.9rem;
    color: #666;
  }
</style>
