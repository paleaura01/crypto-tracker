// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    return { userEmail: null, isAdmin: false };
  }

  // run the admin lookup server-side
  const { data: adminData } = await locals.supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', session.user.id);

  return {
    userEmail: session.user.email,
    isAdmin: !!adminData?.length
  };
};
