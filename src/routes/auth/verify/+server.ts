import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

interface VerifyBody {
  token: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token } = (await request.json()) as VerifyBody;

    // You must specify the OTP type; e.g. 'signup' or 'magiclink'
    const { error } = await supabase.auth.verifyOtp({
      type: 'magiclink',      // ← or 'signup', depending on your flow
      token_hash: token
    });

    if (error) throw error;

    return json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ success: false, error: message }, { status: 500 });
  }
};
