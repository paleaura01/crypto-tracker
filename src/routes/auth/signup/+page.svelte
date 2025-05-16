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

  // 1) Compute USD amount
  $: paymentAmount = selectedPlan === 'monthly'
    ? MONTHLY_AMOUNT_USD
    : LIFETIME_AMOUNT_USD;

  // 2) Guard divide by zero
  $: solanaAmount = solanaPrice > 0
    ? paymentAmount / solanaPrice
    : 0;

  // fetch SOL/USD once on mount
  onMount(async () => {
    try {
      const res = await fetch('/api/solana-price');
      const { price } = await res.json();
      solanaPrice = price;
    } catch {
      message = 'Failed to fetch SOL price';
    }
  });

  async function handleConnectWallet() {
    loading = true;
    message = '';
    try {
      await connectSolflare();
      message = 'Wallet connected successfully!';
    } catch (error) {
      message = error.message;
    } finally {
      loading = false;
    }
  }

  async function handleSignUp() {
    loading = true;
    message = '';

    // prevent Infinity lamports
    if (solanaAmount <= 0) {
      message = 'Please wait for the SOL price to load before subscribing.';
      loading = false;
      return;
    }

    try {
      const ws = $walletStore;
      if (!ws.connected) {
        throw new Error('Please connect your wallet first');
      }

      // sanitize URL so "/?api-key" → "?api-key"
      const rpcUrl = env.PUBLIC_SOLANA_RPC_URL.replace(/\/\?/, '?');
      const connection = new Connection(rpcUrl, 'confirmed');

      const recipientPubKey = new PublicKey(RECIPIENT_ADDRESS);
      const lamports = Math.floor(solanaAmount * LAMPORTS_PER_SOL);

      const { blockhash } = await connection.getLatestBlockhash('finalized');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(ws.publicKey),
          toPubkey: recipientPubKey,
          lamports
        })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ws.publicKey);

      const signedTransaction = await window.solflare.signTransaction(transaction);
      let signature = await connection.sendRawTransaction(signedTransaction.serialize());
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error('Payment transaction failed to confirm');
      }

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password
      });
      if (signupError) {
        throw new Error(signupError.message);
      }

      let userId = signupData?.user?.id;
      if (!userId) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw new Error(userError.message);
        }
        userId = userData?.user?.id;
      }

      // record payment
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: paymentAmount,
          transaction_signature: signature,
          plan: selectedPlan,
          payment_address: RECIPIENT_ADDRESS,
          status: 'active'
        })
      });
      const paymentResult = await res.json();
      if (paymentResult.error) {
        throw new Error(paymentResult.error);
      }

      // set session cookie
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      const res2 = await fetch('/api/set-session-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session })
      });
      if (!res2.ok) {
        const errData = await res2.json();
        throw new Error(errData.error || 'Failed to set session cookie');
      }

      message = `Payment confirmed. Thank you for signing up with the ${
        selectedPlan === 'monthly' ? 'Monthly (30 days)' : 'Lifetime'
      } plan!`;
      goto('/dashboard');
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
      />
      <label for="monthly">
        <span class="plan-title">Monthly Plan</span>
        <span class="plan-price">
          $5/30days (≈ {(MONTHLY_AMOUNT_USD / solanaPrice).toFixed(4)} SOL)
        </span>
      </label>
    </div>
    <div class="radio-option">
      <input
        type="radio"
        id="lifetime"
        name="plan"
        value="lifetime"
        bind:group={selectedPlan}
      />
      <label for="lifetime">
        <span class="plan-title">Lifetime Access</span>
        <span class="plan-price">
          ${LIFETIME_AMOUNT_USD} one-time (≈ {(LIFETIME_AMOUNT_USD / solanaPrice).toFixed(4)} SOL)
        </span>
      </label>
    </div>


  <button
    type="button"
    on:click={handleConnectWallet}
    disabled={loading}
    class="wallet-button"
  >
    {#if $walletStore.connected}
      Connected: {$walletStore.publicKey.slice(0, 4)}…{$walletStore.publicKey.slice(-4)}
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
    {loading ? 'Loading…' : 'Subscribe & Sign Up'}
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