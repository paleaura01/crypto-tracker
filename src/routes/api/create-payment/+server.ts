import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const RECIPIENT_ADDRESS = 'BfzKVGt4WJLBcDbkyzX4Yn1VcAwbk7bF8xohJDHzMGVX';

// shape of the incoming JSON body
interface Payload {
  user_id?: string;
  amount?: number;
  transaction_signature?: string;
  plan?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    /* ---------- Supabase admin client ---------- */
    const supabaseAdmin: SupabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    /* ---------- Parse & validate body ---------- */
    const {
      user_id,
      amount,
      transaction_signature,
      plan
    } = (await request.json()) as Payload;

    console.log('Creating payment record for user:', user_id);

    if (!user_id || !amount || !transaction_signature || !plan) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    /* ---------- Ensure user exists in auth ---------- */
    await new Promise((r) => setTimeout(r, 1000)); // wait for user propagation

    const { data: userExists, error: userCheckError } =
      await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userCheckError || !userExists) {
      return json(
        {
          error:
            userCheckError?.message ??
            'User not found or not yet created in auth.'
        },
        { status: 400 }
      );
    }

    /* ---------- Ensure profile row ---------- */
    const { data: profileRows, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user_id);

    if (profileErr) console.error('Error checking profile:', profileErr);

    if (!profileRows || profileRows.length === 0) {
      const { error: createErr } = await supabaseAdmin
        .from('profiles')
        .insert([{ id: user_id, updated_at: new Date().toISOString() }]);
      if (createErr) console.error('Profile creation error:', createErr);
    }

    /* ---------- Insert payment ---------- */
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('user_payments')
      .insert([
        {
          user_id,
          status: 'active',
          payment_address: RECIPIENT_ADDRESS,
          amount,
          created_at: new Date().toISOString(),
          plan,
          transaction_signature
        }
      ])
      .select()
      .single();

    if (payErr) {
      console.error('Payment creation error:', payErr);
      return json({ error: payErr.message }, { status: 500 });
    }

    console.log('Payment created:', payment);
    return json({ success: true, data: payment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Server error:', message);
    return json({ error: message }, { status: 500 });
  }
};
