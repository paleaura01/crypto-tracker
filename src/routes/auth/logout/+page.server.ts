import { redirect } from '@sveltejs/kit';

export async function POST({ locals }) {
    try {
        // Clear supabase session
        await locals.supabase.auth.signOut();

        // Clear session cookie
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Set-Cookie': 'sb-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
        throw redirect(303, '/');
    }
}