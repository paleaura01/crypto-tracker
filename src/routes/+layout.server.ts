// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // locals.session was set in hooks.server.ts via safeGetSession()
  return { session: locals.session };
};
