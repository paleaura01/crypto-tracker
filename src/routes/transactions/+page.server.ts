import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: transactions, error } = await locals.supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return { transactions };
};
