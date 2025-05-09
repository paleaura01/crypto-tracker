<svelte:head>
  <title>Welcome | Crypto Tracker</title>
</svelte:head>

<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
  
    let loading = true;
    let userEmail = null;
    let isAdmin = false;
    let errorMessage = '';
  
    onMount(async () => {
      console.log('Dashboard onMount: starting session check...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('getSession() result:', session, 'error:', error);
  
        if (error) {
          errorMessage = `Error fetching session: ${error.message}`;
        } else if (session) {
          userEmail = session.user.email;
          console.log('User is logged in:', userEmail);

          // Check if the user is an admin
          const { data: adminCheck, error: adminError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (!adminError && adminCheck) {
            isAdmin = true;
            // Removed auto-redirect to allow viewing the dashboard
          }
        } else {
          console.log('No session found. User not logged in.');
        }
      } catch (err) {
        console.error('onMount error:', err);
        errorMessage = `Exception in onMount: ${err.message}`;
      } finally {
        loading = false;
      }
    });
</script>

{#if loading}
  <p>Loading dashboard...</p>
{:else if errorMessage}
  <p style="color: red;">
    There was an error loading your dashboard: {errorMessage}
  </p>
{:else if userEmail}
  <h1>Dashboard</h1>
  <p>Welcome, {userEmail}!</p>
  
  {#if isAdmin}
    <p>You have admin access. Visit the <a href="/admin">Admin Dashboard</a> to manage users.</p>
  {/if}
  
  <p>This is your personal dashboard.</p>
{:else}
  <h1>Dashboard</h1>
  <p>
    You are not logged in. Please
    <a href="/auth/login">Login</a> or
    <a href="/auth/signup">Sign Up</a>.
  </p>
{/if}