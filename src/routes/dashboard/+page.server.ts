import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: stats, error } = await locals.supabaseAdmin
    .from('dashboard_stats')
    .select('*');

  if (error) {
    console.error('Failed to load dashboard', error);
  }

  return { stats: stats ?? [] };
};
