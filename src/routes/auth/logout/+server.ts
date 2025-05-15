import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
  // Use the SSR client to clear cookies & Supabase session
  await locals.supabase.auth.signOut();

  // remove Supabase cookies
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  cookies.delete('sb-persist-session', { path: '/' });

  // redirect back to home or login
  throw redirect(303, '/');
};
