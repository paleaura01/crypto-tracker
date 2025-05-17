<!-- src/routes/auth/signup/+page.svelte -->
<svelte:head>
  <title>Sign Up | CryptoTracker</title>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import { walletStore, connectSolflare, requestAirdrop } from '$lib/stores/wallet';
  import { env } from '$env/dynamic/public';
  import { get } from 'svelte/store';
  import {
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram
  } from '@solana/web3.js';

  let mounted = false;
  let email = '';
  let password = '';
  let loading = false;
  let message = '';

  let solanaPrice = 0;
  let solanaAmount = 0;
  let selectedPlan: 'monthly' | 'lifetime' = 'monthly';

  const MONTHLY_AMOUNT_USD = 5;
  const LIFETIME_AMOUNT_USD = 50;
  const RECIPIENT_ADDRESS = 'BfzKVGt4WJLBcDbkyzX4Yn1VcAwbk7bF8xohJDHzMGVX';

  // compute solanaAmount reactively
  $: {
    const paymentAmount = selectedPlan === 'monthly'
      ? MONTHLY_AMOUNT_USD
      : LIFETIME_AMOUNT_USD;
    solanaAmount = solanaPrice > 0 ? paymentAmount / solanaPrice : 0;
  }

  onMount(async () => {
    mounted = true;
    try {
      const res = await fetch('/api/solana-price');
      const { price } = await res.json();
      solanaPrice = price;
    } catch {
      message = 'Failed to fetch SOL price.';
    }
  });

  async function handleConnectWallet() {
    loading = true;
    message = '';
    try {
      await connectSolflare();
      message = 'Wallet connected!';
    } catch (err: any) {
      message = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleSignUp() {
    loading = true;
    message = '';
    if (solanaAmount <= 0) {
      message = 'Waiting for SOL price…';
      loading = false;
      return;
    }
    const ws = get(walletStore);
    if (!ws.connected || !ws.publicKey) {
      message = 'Please connect your wallet first.';
      loading = false;
      return;
    }
    try {
      // build & send SOL transfer
      const conn = new Connection(env.PUBLIC_SOLANA_RPC_URL.replace(/\/\?/, '?'), 'confirmed');
      const fromPub = new PublicKey(ws.publicKey);
      const toPub = new PublicKey(RECIPIENT_ADDRESS);
      const lamports = Math.floor(solanaAmount * LAMPORTS_PER_SOL);
      const { blockhash } = await conn.getLatestBlockhash();
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: fromPub, toPubkey: toPub, lamports })
      );
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPub;

      const solflare = (window as any).solflare;
      if (!solflare) throw new Error('Solflare not available');
      const signed = await solflare.signTransaction(tx);
      const sig = await conn.sendRawTransaction(signed.serialize());
      const conf = await conn.confirmTransaction(sig);
      if (conf.value.err) throw new Error('Payment failed to confirm.');

      // sign up user
      const { data: suData, error: suErr } = await supabase.auth.signUp({ email, password });
      if (suErr) throw suErr;

      let userId = suData.user?.id;
      if (!userId) {
        const { data: guData, error: guErr } = await supabase.auth.getUser();
        if (guErr) throw guErr;
        userId = guData.user?.id!;
      }

      // record payment
      const payRes = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: selectedPlan === 'monthly' ? MONTHLY_AMOUNT_USD : LIFETIME_AMOUNT_USD,
          transaction_signature: sig,
          plan: selectedPlan
        })
      });
      const payJson = await payRes.json();
      if (payJson.error) throw new Error(payJson.error);

      // set session cookie
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;
      const setRes = await fetch('/api/set-session-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session })
      });
      if (!setRes.ok) {
        const errJson = await setRes.json();
        throw new Error(errJson.error);
      }

goto('/dashboard', { replaceState: true, invalidateAll: true });
    } catch (err: any) {
      console.error(err);
      message = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<main>
  <div class="max-w-md mx-auto mt-12 p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-semibold mb-4">Sign Up</h1>

    <!-- WRAP INPUTS & BUTTON IN A FORM -->
    <form on:submit|preventDefault={handleSignUp} class="space-y-4 mb-6">
      <input
        type="email"
        bind:value={email}
        placeholder="Email"
        autocomplete="email"
        class="w-full px-4 py-2 border rounded border-gray-500"
        required
      />
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        autocomplete="new-password"
        class="w-full px-4 py-2 border rounded border-gray-500"
        required
      />

      <fieldset class="p-4 rounded mb-6">
        <legend class="font-medium mb-2">Choose your plan</legend>
        <label class="flex items-center mb-2 space-x-3 cursor-pointer">
          <input
            type="radio"
            name="plan"
            value="monthly"
            bind:group={selectedPlan}
            class="form-radio text-green-500"
          />
          <span>
            Monthly – $5
            {#if mounted && solanaAmount > 0} (≈ {solanaAmount.toFixed(4)} SOL){/if}
          </span>
        </label>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="radio"
            name="plan"
            value="lifetime"
            bind:group={selectedPlan}
            class="form-radio text-green-500"
          />
          <span>
            Lifetime – $50
            {#if mounted && solanaAmount > 0} (≈ {solanaAmount.toFixed(4)} SOL){/if}
          </span>
        </label>
      </fieldset>

      {#if mounted}
        <button
          type="button"
          on:click={handleConnectWallet}
          class="w-full mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
          disabled={loading}
        >
          {#if $walletStore.connected && $walletStore.publicKey}
            Connected: {$walletStore.publicKey.slice(0,4)}…{$walletStore.publicKey.slice(-4)}
          {:else}
            Connect Wallet
          {/if}
        </button>

        {#if $walletStore.connected && $walletStore.publicKey}
          <div class="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Balance: {$walletStore.balance} SOL
          </div>
          <button
            type="button"
            on:click={requestAirdrop}
            class="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            Request Airdrop
          </button>
        {/if}
      {/if}

      <!-- now this button submits the form -->
      <button
        type="submit"
        class="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded disabled:opacity-50 transition"
        disabled={loading || !get(walletStore).connected}
      >
        {loading ? 'Processing…' : 'Subscribe & Sign Up'}
      </button>
    </form>

    {#if message}
      <p class="mt-4 text-center text-red-500">{message}</p>
    {/if}
  </div>
</main>
