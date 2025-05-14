// src/routes/portfolio/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: portfolio, error } = await locals.supabase
    .from('portfolio')
    .select('*');

  if (error) {
    console.error('Failed to load portfolio', error);
  }

  return { portfolio: portfolio ?? [] };
};
