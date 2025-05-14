import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: stats, error } = await locals.supabase
    .from('dashboard_stats')
    .select('*');

  if (error) {
    console.error('Dashboard load error', error);
  }

  return { stats: stats ?? [] };
};
