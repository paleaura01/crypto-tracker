import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/** ――― 1. ignore ACME /.well-known routes ――― */
const ignoreWellKnown: Handle = ({ event, resolve }) =>
	event.url.pathname.startsWith('/.well-known/')
		? new Response(null, { status: 204 })
		: resolve(event);

/** ――― 2. create Supabase clients + pull session ――― */
const initSupabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: event.cookies,
		cookieOptions: { path: '/' }
	});

	event.locals.supabaseAdmin = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		cookies: event.cookies,
		cookieOptions: { path: '/' }
	});

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();
	event.locals.session = session;

	return resolve(event);
};

/** ――― 3. simple auth guard ――― */
const guard: Handle = ({ event, resolve }) => {
	const path = event.url.pathname;
	const loggedIn = Boolean(event.locals.session);

	if (!loggedIn && !path.startsWith('/auth/')) {
		throw redirect(303, '/auth/login');
	}
	if (loggedIn && (path === '/auth/login' || path === '/auth/signup')) {
		throw redirect(303, '/dashboard');
	}
	return resolve(event);
};

export const handle = sequence(ignoreWellKnown, initSupabase, guard);
