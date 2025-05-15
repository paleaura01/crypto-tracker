// src/routes/portfolio/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // locals.supabase is already authenticated
  const { data } = await locals.supabase
    .from('portfolio')
    .select('*');
  return { portfolio: data };
};
