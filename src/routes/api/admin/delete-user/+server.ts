// src\routes\api\admin\delete-user\+server.js

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

interface DeleteBody {
  userId: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Verify session and admin
    const session = locals.session;
    if (!session) {
      return json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { data: adminCheck, error: adminError } = await locals.supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id);
    if (adminError || !adminCheck?.length) {
      return json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const { userId } = (await request.json()) as DeleteBody;

    // Delete payment records
    const { error: paymentError } = await locals.supabaseAdmin
      .from('user_payments')
      .delete()
      .eq('user_id', userId);
    if (paymentError) {
      console.error('Error deleting payment records:', paymentError);
      throw new Error('Failed to delete payment records');
    }

    // Delete the user
    const { error: userError } = await locals.supabaseAdmin.auth.admin.deleteUser(
      userId
    );
    if (userError) {
      console.error('Error deleting user:', userError);
      throw new Error('Failed to delete user');
    }

    return json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Delete user error:', message);
    return json({ message }, { status: 500 });
  }
};
