import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;
  const user = locals.user;

  // ③ Admin detection: compare against an ENV list or specific email
  //    You might store multiple in ADMIN_EMAILS, comma-separated.
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = user?.email
    ? adminEmails.includes(user.email.toLowerCase())
    : false;

  return { session, isAdmin };
};
