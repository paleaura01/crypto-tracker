import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // locals.session & locals.user were set in hooks.server.ts
  const session = locals.session;
  const user = locals.user;

  // determine admin status however you like:
  // for example, check a custom claim, or look up in your own table
  const isAdmin = user?.email === 'admin@yourdomain.com';

  return { session, isAdmin };
};
