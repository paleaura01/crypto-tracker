// src/routes/auth/login/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (locals.session) throw redirect(303, '/');
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      return fail(400, { error: error.message });
    }

    // now that the SSR client has written the cookies,
    // throw a redirect and SSR will read the new session
    throw redirect(303, '/');
  }
};
