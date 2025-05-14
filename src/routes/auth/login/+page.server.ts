// src/routes/auth/login/+page.server.ts
import { fail, redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = form.get('email')?.toString() ?? '';
    const password = form.get('password')?.toString() ?? '';

    // Use the SSR Supabase client on locals so it sets the cookie!
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      return fail(400, { error: error?.message ?? 'Login failed' });
    }

    // Login succeeded — cookie is set by the SSR client, now redirect:
    throw redirect(303, '/dashboard');
  }
};
