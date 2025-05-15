import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  const session = locals.session;
  const isAdmin = session?.user?.app_metadata?.role === 'admin';
  return { session, isAdmin };
};
