<script lang="ts">
	import { supabase } from '$lib/services/supabaseClient';
	let email = '', password = '', error = '';
	async function signIn() {
		const { error: err } = await supabase.auth.signInWithPassword({ email, password });
		if (err) error = err.message;
		else window.location.href = '/dashboard';
	}
</script>

<h2 class="text-xl font-semibold mb-2">Log in</h2>
<form on:submit|preventDefault={signIn} class="space-y-2">
	<input class="border p-2 w-full" bind:value={email} type="email" placeholder="Email" />
	<input class="border p-2 w-full" bind:value={password} type="password" placeholder="Password" />
	<button class="btn btn-primary w-full">Sign in</button>
	{#if error}<p class="text-red-600 text-sm">{error}</p>{/if}
</form>
