<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { supabase } from '$lib/supabaseClient';
  import { invalidateAll } from '$app/navigation';
  import type { WalletAccount, ExchangeV3Account } from '$lib/server/types';

  // Now we only need wallets and V3
  export let wallets: WalletAccount[] = [];
  export let exchangeV3: ExchangeV3Account[] = [];

  let statusMessage = "No Coinbase key loaded.";
  let fileInput: HTMLInputElement;

  function applyKeyData(keyData: any) {
    if (browser) localStorage.setItem('coinbaseKey', JSON.stringify(keyData));
    statusMessage = "🔑 Coinbase API key loaded.";
  }

  onMount(async () => {
    if (!browser) return;

    // 1) localStorage
    const saved = localStorage.getItem('coinbaseKey');
    if (saved) {
      statusMessage = "🔑 Loaded Coinbase key from local storage.";
      return;
    }

    // 2) DB
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      statusMessage = "Please log in to load your key.";
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('coinbase_key_json')
      .eq('id', user.id)
      .single();

    if (data?.coinbase_key_json) {
      applyKeyData(data.coinbase_key_json);
    } else {
      statusMessage = "No Coinbase key loaded.";
      console.log("No key in DB for", user.id, error?.message);
    }
  });

  async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.type !== "application/json") {
      alert("Please upload a JSON file.");
      return;
    }

    try {
      const keyData = JSON.parse(await file.text());
      applyKeyData(keyData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, coinbase_key_json: keyData });

      if (error) throw error;
      await invalidateAll();
    } catch (err: any) {
      console.error("Upload error", err);
      alert(err.message || "Failed to upload key");
    }
  }

  function clearLocalKey() {
    if (browser) {
      localStorage.removeItem('coinbaseKey');
      fileInput.value = "";
    }
    statusMessage = "🗑️ Local key cache cleared.";
  }

  async function clearDatabaseKey() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not signed in");
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ coinbase_key_json: null })
      .eq('id', user.id);

    if (error) {
      console.error("DB clear error", error);
      alert("Failed to clear DB key");
    } else {
      clearLocalKey();
      statusMessage = "🗑️ Database key cleared.";
      await invalidateAll();
    }
  }
</script>

<div class="  space-y-2">
  <h3 class="text-lg font-medium">Connect Coinbase API Key</h3>
  <p>{statusMessage}</p>

  <input
    bind:this={fileInput}
    type="file"
    accept="application/json"
    on:change|preventDefault={handleFileUpload}
    class="block mb-2"
  />

  <div class="flex space-x-2">
    <button on:click={clearLocalKey} class="px-3 py-1 bg-yellow-500 text-white rounded text-sm">
      Clear Local Key
    </button>
    <button on:click={clearDatabaseKey} class="px-3 py-1 bg-red-600 text-white rounded text-sm">
      Clear DB Key
    </button>
  </div>
</div>

<!-- Advanced “wallet” balances -->
<section class="dark:text-white mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Advanced Exchange Balances</h2>
  {#if wallets.length}
    <ul class="list-disc pl-5">
      {#each wallets.filter(w => Number(w.balance.amount) > 0) as acct (acct.id)}
        <li>{acct.balance.currency}: {acct.balance.amount}</li>
      {/each}
    </ul>
  {:else}
    <p>No wallet balances.</p>
  {/if}
</section>

<!-- V3 exchange balances -->
<section class="dark:text-white mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Exchange Balances</h2>
  {#if exchangeV3.length}
    <ul class="list-disc pl-5">
      {#each exchangeV3.filter(a => Number(a.available_balance?.value ?? a.balance?.value ?? "0") > 0) as acct (acct.id ?? acct.currency)}
        <li>
          {acct.currency}: {acct.available_balance?.value ?? acct.balance?.value}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No balances found.</p>
  {/if}
</section>
