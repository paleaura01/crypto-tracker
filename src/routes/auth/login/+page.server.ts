// src/routes/auth/login/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (locals.session) throw redirect(303, '/dashboard');
};

export const actions = {
  default: async ({ request, locals, cookies }) => {
    const form = await request.formData();
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    // attempt to log in
    const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });

    console.log('[login action] signIn data=', data, 'error=', error);
    console.log(
      '[login action] sb-access-token=',
      cookies.get('sb-access-token'),
      'sb-refresh-token=',
      cookies.get('sb-refresh-token')
    );

    if (error) {
      return fail(400, { error: error.message });
    }

    // If you prefer dashboard as landing:
    throw redirect(303, '/dashboard');
  }
};
