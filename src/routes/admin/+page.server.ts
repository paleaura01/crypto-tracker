import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabaseAdmin
		.from('dashboard_stats')
		.select('*');

	if (error) throw error;
	return { stats: data ?? [] };
};
