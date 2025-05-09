<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    
    let userEmail = null;
    let isAdmin = false;

    export async function handleSignOut() {
    try {
        // First clear the auth state
        await supabase.auth.signOut();
        
        // Clear any stored session data
        localStorage.removeItem('sb-session');
        
        // Make a server request to clear session cookies
        await fetch('/auth/logout', { 
            method: 'POST',
            credentials: 'same-origin'
        });

        // Force reload to clear all state
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}
    // Updated admin check function
    async function checkAdmin(userId) {
  console.log('[Layout] Checking admin status for user:', userId);
  try {
    const { data: adminCheck, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId);
      
    if (error) {
      console.error('[Layout] Admin check error:', error);
      isAdmin = false;
    } else {
      isAdmin = adminCheck && adminCheck.length > 0;
      console.log('[Layout] Admin check result:', isAdmin, 'Data:', adminCheck);
    }
  } catch (err) {
    console.error('[Layout] Admin check exception:', err);
    isAdmin = false;
  }
}
    
    onMount(async () => {
      console.log('[Layout] Mounting layout component');
      
      // Initial session check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[Layout] Found existing session');
        userEmail = session.user.email;
        await checkAdmin(session.user.id);
      }
      
      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Layout] Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          userEmail = session.user.email;
          await checkAdmin(session.user.id);
        } else {
          userEmail = null;
          isAdmin = false;
        }
      });
      
      return () => {
        console.log('[Layout] Unsubscribing from auth changes');
        subscription.unsubscribe();
      };
    });
  </script>
  
  
  <nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f5f5f5;">
    <div>
      <a href="/dashboard">Dashboard</a>
      &nbsp;|&nbsp;
      <a href="/portfolio">Portfolio</a>
      &nbsp;|&nbsp;
      <a href="/transactions">Transactions</a>
      {#if isAdmin}
        &nbsp;|&nbsp;
        <a href="/admin" style="color: #ff4444;">Admin Dashboard</a>
      {/if}
    </div>
    <div style="margin-left: auto;">
      {#if userEmail}
        <span>Logged in as: {userEmail}</span>
        {#if isAdmin}
          <span style="color: #ff4444;"> (Admin)</span>
        {/if}
        &nbsp;|&nbsp;
        <button on:click={handleSignOut}>Sign Out</button>
      {:else}
        <a href="/auth/login">Login</a>
        &nbsp;|&nbsp;
        <a href="/auth/signup">Sign Up</a>
      {/if}
    </div>
  </nav>
  
  <slot />
  