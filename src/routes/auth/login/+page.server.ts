// src/routes/auth/login/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';
export const actions = {
  default: async ({ locals, request }) => {
    const form = Object.fromEntries(await request.formData());
    const { error } = await locals.supabase.auth.signInWithPassword(form);
    if (error) {
      return fail(401, { error: error.message });
    }
    // session is set by handleAuth → redirect
    throw redirect(303, '/dashboard');
  }
};
