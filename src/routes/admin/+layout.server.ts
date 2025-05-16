import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    throw redirect(303, '/auth/login');
  }

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
};
