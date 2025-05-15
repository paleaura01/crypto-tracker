// src/routes/admin/+page.server.ts
import { redirect, type PageServerLoad } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/auth/login');

  // Check admin role in your own table
  const { data: admins } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id);

  if (!admins?.length) throw redirect(303, '/dashboard');

  // Fetch users & payments
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const { data: payments } = await supabaseAdmin.from('user_payments').select('*');

  return {
    users: users.map(u => ({
      ...u,
      plan: payments.find(p => p.user_id === u.id)?.plan ?? 'N/A',
      status: payments.find(p => p.user_id === u.id)?.status ?? 'inactive'
    })),
    adminEmail: session.user.email
  };
};
