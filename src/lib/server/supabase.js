import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export function getSupabase(cookieHeader) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        },
        global: {
            headers: {
                cookie: cookieHeader || ''
            }
        }
    });
}