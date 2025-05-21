<!-- src/routes/portfolio/components/CoinbaseExchange.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { supabase } from '$lib/supabaseClient';
  import { invalidateAll } from '$app/navigation';
  import type { ExchangeV2Account, ExchangeV3Account } from '$lib/server/types';

  export let exchangeV2: ExchangeV2Account[] = [];
  export let exchangeV3: ExchangeV3Account[] = [];

  let statusMessage = "No Coinbase key loaded.";
  let fileInput: HTMLInputElement;

  function applyKeyData(keyData: any) {
    if (browser) {
      localStorage.setItem('coinbaseKey', JSON.stringify(keyData));
    }
    statusMessage = "🔑 Coinbase API key loaded.";
    console.log("🔑 Loaded Coinbase key:", keyData);
  }

  onMount(async () => {
    if (!browser) return;

    // 1) Try local storage
    const saved = localStorage.getItem('coinbaseKey');
    if (saved) {
      statusMessage = "🔑 Loaded Coinbase key from local storage.";
      return;
    }

    // 2) Try DB
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
      console.log("No key found in DB for user", user.id, error?.message);
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
      const text = await file.text();
      const keyData = JSON.parse(text);
      console.log("📁 Uploaded cdp_api_key.json:", keyData);

      applyKeyData(keyData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, coinbase_key_json: keyData },
          { returning: 'minimal' }
        );

      if (error) {
        console.error("❌ DB upsert error:", error.message);
        alert("Failed to save key to database.");
      } else {
        console.log("✅ Key upserted in DB for user", user.id);
        await invalidateAll();
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Could not parse JSON file. Check its format.");
    }
  }

  function clearLocalKey() {
    if (browser) localStorage.removeItem('coinbaseKey');
    statusMessage = "🗑️ Local key cache cleared.";
    console.log("🗑️ Cleared Coinbase key from local storage");
    if (fileInput) fileInput.value = "";
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
      console.error("❌ DB clear error:", error.message);
      alert("Failed to clear key from database.");
    } else {
      console.log("🗑️ Cleared Coinbase key from DB for user", user.id);
      clearLocalKey();
      statusMessage = "🗑️ Database key cleared. Please upload again.";
      await invalidateAll();
    }
  }
</script>

<div class="p-4 border rounded space-y-3">
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
    <button
      on:click={clearLocalKey}
      class="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
    >
      Clear Local Key
    </button>

    <button
      on:click={clearDatabaseKey}
      class="px-3 py-1 bg-red-600 text-white rounded text-sm"
    >
      Clear DB Key
    </button>
  </div>
</div>

<section class="dark:text-white mb-6">
  <h2 class="text-xl font-semibold">Coinbase Advanced Exchange Balances</h2>
  {#if exchangeV2.length}
    <ul class="list-disc pl-5">
      {#each exchangeV2 as acct}
        {#if +acct.balance.amount > 0}
          <li>{acct.currency.code}: {acct.balance.amount}</li>
        {/if}
      {/each}
    </ul>
  {:else}
    <p>No balances found.</p>
  {/if}
</section>

<div class="dark:text-white mb-6">
  <h2 class="text-xl font-semibold mb-2">Coinbase Exchange Balances</h2>
  {#if exchangeV3.length}
    <ul class="list-disc pl-5">
      {#each exchangeV3
        .filter(a => Number(a.available_balance?.value ?? 0) > 0)
        as acct, idx (`v3-${acct.id ?? idx}`)}
        <li>
          {acct.currency}:
          {acct.available_balance?.value ?? acct.balance?.value ?? 0}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No balances found.</p>
  {/if}
</div>
