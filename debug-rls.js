// Debug script to test RLS authentication
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'https://usmcnnvgdntpxjhhhplt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbWNubnZnZG50cHhqaGhocGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MTAzNDUsImV4cCI6MjA1MDA4NjM0NX0.Xdoy8oYNf9VjvhCCqQLqkNbCnDCYKOv5wHUGZWr1yDU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session error:', sessionError);
    
    if (session) {
      console.log('User ID:', session.user.id);
      console.log('Access token (first 50 chars):', session.access_token.substring(0, 50) + '...');
      
      // Test if we can query token_overrides
      const { data, error } = await supabase
        .from('token_overrides')
        .select('*')
        .limit(1);
      
      console.log('Query result:', data);
      console.log('Query error:', error);
      
      // Test insert
      const { data: insertData, error: insertError } = await supabase
        .from('token_overrides')
        .insert({
          contract_address: '0x1234567890123456789012345678901234567890',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'TEST',
          wallet_address: '0x1234567890123456789012345678901234567890'
        })
        .select();
      
      console.log('Insert result:', insertData);
      console.log('Insert error:', insertError);
    } else {
      console.log('No active session found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();
