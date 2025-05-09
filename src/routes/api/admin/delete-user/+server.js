import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    try {
        // Verify admin status
        const session = locals.session;
        if (!session) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminCheck } = await locals.supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id);

        if (!adminCheck?.length) {
            return json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await request.json();

        // First delete user's payment records
        const { error: paymentError } = await locals.supabaseAdmin
            .from('user_payments')
            .delete()
            .eq('user_id', userId);

        if (paymentError) {
            console.error('Error deleting payment records:', paymentError);
            throw new Error('Failed to delete payment records');
        }

        // Then delete the user
        const { error: userError } = await locals.supabaseAdmin
            .auth.admin.deleteUser(userId);

        if (userError) {
            console.error('Error deleting user:', userError);
            throw new Error('Failed to delete user');
        }

        return json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return json({ message: error.message }, { status: 500 });
    }
}