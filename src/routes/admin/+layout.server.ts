import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	// you could add extra admin-specific info here
	return { session: locals.session };
};
