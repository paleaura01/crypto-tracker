import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: portfolio, error } = await locals.supabase
    .from('portfolio')
    .select('*');

  if (error) {
    console.error('Portfolio load error', error);
  }

  return { portfolio: portfolio ?? [] };
};
