<script lang="ts">
  import '../app.css';                             // ① import your global Tailwind CSS :contentReference[oaicite:0]{index=0}

  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';

  // `data.supabase` and `data.session` come from your +layout.ts load function
  export let data: { supabase: any; session: any };

  onMount(() => {
    // ② Correctly destructure the Subscription from the nested `data` object
    const { data: { subscription } } =
      data.supabase.auth.onAuthStateChange((_event, newSession) => {
        // When the session changes, re-invalidate the load function
        if (newSession?.expires_at !== data.session?.expires_at) {
          invalidate('supabase:auth');
        }
      });

    // ③ Clean up the listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  });

  // Example method to log out
  function signOut() {
    data.supabase.auth.signOut();
  }
</script>

<nav class="bg-gray-900 text-white p-4 flex justify-between items-center">
  <h1 class="text-2xl font-bold text-blue-500">CryptoTracker</h1>
  {#if data.session}
    <div class="space-x-4">
      <span>{data.session.user.email}</span>
      <button on:click={signOut} class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500">
        Log Out
      </button>
    </div>
  {:else}
    <a href="/auth/login" class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500">Log In</a>
  {/if}
</nav>

<slot />
