<!-- src/routes/portfolio/components/ExchangeConnect.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { supabase } from '$lib/supabaseClient';
  import { invalidateAll } from '$app/navigation';

  // Reference to the <input> so we can reset its value
  let fileInput: HTMLInputElement;

  let statusMessage = "No Coinbase key loaded.";

  function applyKeyData(keyData: any) {
    if (browser) {
      localStorage.setItem('coinbaseKey', JSON.stringify(keyData));
    }
    statusMessage = "🔑 Coinbase API key loaded.";
    console.log("🔑 Loaded Coinbase key:", keyData);
  }

  onMount(async () => {
    if (!browser) return;

    // 1) Check localStorage
    const saved = localStorage.getItem('coinbaseKey');
    if (saved) {
      statusMessage = "🔑 Loaded Coinbase key from local storage.";
      return;
    }

    // 2) Fetch from DB
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
        // Re-run page load so balances appear immediately
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
    // Reset the file-input so re-selecting the same file fires change again
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
      clearLocalKey();  // also clears the input
      statusMessage = "🗑️ Database key cleared. Please upload again.";
      // Re-run page load so upload prompt appears immediately
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
