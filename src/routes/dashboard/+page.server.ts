// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    // not logged in — redirect to login
    throw redirect(303, '/auth/login');
  }

  // server‐side admin check
  const { data: adminData } = await locals.supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', session.user.id);

  return {
    userEmail: session.user.email,
    isAdmin: !!adminData?.length
  };
};
