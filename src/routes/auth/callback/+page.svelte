<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabaseClient';

    let message = 'Processing authentication...';

    onMount(async () => {
        const { error } = await supabase.auth.getSession();
        if (error) {
            message = 'Authentication error. Please try again.';
            return;
        }
        
        message = 'Authentication successful!';
        setTimeout(() => goto('/dashboard'), 2000);
    });
</script>

<h1>Authenticating...</h1>
<p>{message}</p>