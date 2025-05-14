// src/routes/admin/+layout.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  // Use the session parsed in hooks.server.js
  const session = locals.session;
  if (!session) {
    throw redirect(303, '/auth/login');
  }

  // Use the admin client (service role key) for the privileged query
  const { data: adminData } = await locals.supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('user_id', session.user.id);

  if (!adminData?.length) {
    throw redirect(303, '/dashboard');
  }

  return {
    user: session.user,
    isAdmin: true
  };
}
