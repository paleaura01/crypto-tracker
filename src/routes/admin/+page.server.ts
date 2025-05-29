import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    throw redirect(303, '/auth/login');
  }

  const { data: adminData, error: adminError } = await locals.supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('user_id', session.user.id);

  if (adminError || !adminData?.length) {
    throw redirect(303, '/dashboard');
  }

  const { data: paymentData = [] } = await locals.supabaseAdmin
    .from('user_payments')
    .select('*');

  const { data: userListResult } = await locals.supabaseAdmin
    .auth.admin.listUsers();

  // normalize both shapes
  const userListResultData = userListResult as {
    users?: unknown[];
    data?: { users?: unknown[] };
  };
  const allUsers =
    userListResultData?.users ??
    userListResultData?.data?.users ??
    [];

  const users = Array.isArray(allUsers)
    ? allUsers
        .filter((u): u is { email: string; id: string; created_at: string; last_sign_in_at?: string } => {
          return typeof u === 'object' && u !== null && 
                 typeof (u as { email?: unknown }).email === 'string' &&
                 (u as { email: string }).email !== session.user.email;
        })
        .map((u) => {
          const payment = (paymentData || []).find((p) => p.user_id === u.id) || {};
          return {
            user_id: u.id,
            email: u.email,
            plan: payment.plan ?? 'N/A',
            status: payment.status ?? 'inactive',
            amount: payment.amount ?? 0,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null
          };
        })
    : [];

  return {
    users,
    adminEmail: session.user.email
  };
};
