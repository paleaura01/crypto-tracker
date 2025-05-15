// src/routes/auth/logout/+server.ts
import { redirect } from '@sveltejs/kit';
export const POST = async ({ locals }) => {
  // clears both the refresh-token cookie and the session in Supabase
  await locals.supabase.auth.signOut();
  // send you home and now locals.session will be null
  throw redirect(303, '/auth/login');
};
