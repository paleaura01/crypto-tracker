import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  try {
    const session = locals.session;
    if (!session) {
      throw redirect(303, '/auth/login');
    }

    // Check if current user is admin
    const { data: adminData, error: adminError } = await locals.supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id);

    if (adminError || !adminData?.length) {
      throw redirect(303, '/dashboard');
    }

    // Get user payment data
    const { data: paymentData, error: paymentError } = await locals.supabaseAdmin
      .from('user_payments')
      .select('*');

    if (paymentError) {
      console.error('Error fetching payment data:', paymentError);
      return { users: [] };
    }

    // Get all users from auth.users
    const { data: userData, error: userError } = await locals.supabaseAdmin
      .auth.admin.listUsers();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return { users: [] };
    }

    // Add this debugging to see the actual structure
    console.log('userData structure:', JSON.stringify(userData));

    // Add proper validation before using users
    const users = userData?.users || userData?.data?.users || []; // Handle different possible structures
    
    // Only proceed with filter if users is an array
    const formattedUsers = Array.isArray(users) 
      ? users
          .filter(user => user.email !== session.user.email) // Exclude admin
          .map(user => {
            const userPayment = paymentData.find(payment => payment.user_id === user.id) || {};
            return {
              user_id: user.id,
              email: user.email,
              plan: userPayment.plan || 'N/A',
              status: userPayment.status || 'inactive',
              amount: userPayment.amount || 0,
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at
            };
          })
      : [];

    return {
      users: formattedUsers,
      adminEmail: session.user.email
    };

  } catch (error) {
    console.error('Admin page error:', error);
    throw redirect(303, '/auth/login');
  }
}