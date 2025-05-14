import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';

const RECIPIENT_ADDRESS = 'BfzKVGt4WJLBcDbkyzX4Yn1VcAwbk7bF8xohJDHzMGVX';

export async function POST({ request }) {
    try {
        // Only use dynamic environment variables without fallbacks
        const supabaseAdmin = createClient(
            env.SUPABASE_URL, 
            env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { user_id, amount, transaction_signature, plan } = await request.json();

        console.log('Creating payment record for user:', user_id);

        if (!user_id || !amount || !transaction_signature || !plan) {
            return new Response(JSON.stringify({ 
                error: 'Missing required fields' 
            }), { status: 400 });
        }

        // Add delay to allow user to propagate to auth_users table
        await new Promise(resolve => setTimeout(resolve, 1000));

        // First check if user exists in auth_users
        console.log('Verifying user exists...');
        const { data: userExists, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        
        if (userCheckError || !userExists) {
            console.error('User not found in auth system:', userCheckError || 'No user data');
            return new Response(JSON.stringify({ 
                error: `User not found: ${userCheckError?.message || 'User may not be fully created yet'}` 
            }), { status: 400 });
        }

        // Check if profile exists and create if needed
        console.log('Checking for existing profile...');
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user_id);

        if (profileCheckError) {
            console.error('Error checking profile:', profileCheckError);
        }

        // Create profile if needed
        if (!existingProfile || existingProfile.length === 0) {
            console.log('Profile not found, creating new profile for user:', user_id);
            try {
                const { data: newProfile, error: createError } = await supabaseAdmin
                    .from('profiles')
                    .insert([{ 
                        id: user_id,
                        updated_at: new Date().toISOString()
                    }]);
                
                if (createError) {
                    console.error('Error creating profile:', createError);
                } else {
                    console.log('Profile created successfully');
                }
            } catch (err) {
                console.warn('Profile creation attempt warning:', err);
            }
        }

        // Create payment record
        console.log('Creating payment record...');
        const { data: paymentData, error: paymentError } = await supabaseAdmin
            .from('user_payments')
            .insert([{
                user_id,
                status: 'active',
                payment_address: RECIPIENT_ADDRESS,
                amount,
                created_at: new Date().toISOString(),
                plan,
                transaction_signature
            }])
            .select();

        if (paymentError) {
            console.error('Payment creation error:', paymentError);
            return new Response(JSON.stringify({ 
                error: `Failed to create payment: ${JSON.stringify(paymentError)}` 
            }), { status: 500 });
        }

        console.log('Payment record created successfully:', paymentData);
        return json({ success: true, data: paymentData });
    } catch (err) {
        console.error('Server error:', err);
        return new Response(JSON.stringify({ 
            error: err.message 
        }), { status: 500 });
    }
}