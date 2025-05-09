import { supabase } from '$lib/supabase';

export async function POST({ request }) {
  try {
    const { token } = await request.json();
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error in verify endpoint:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}