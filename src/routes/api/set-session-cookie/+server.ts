import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

const PROJECT_ID = 'usmcnnvgdntpxjhhhplt';
const STORAGE_KEY = `sb-${PROJECT_ID}-auth-token`;

export async function POST({ request }) {
  console.log('[set-session] Processing session cookie request');
  
  try {
    const body = await request.json();
    console.log('[set-session] Request body:', {
      hasSession: !!body.session,
      sessionType: body.session ? typeof body.session : null
    });
    
    if (!body.session) {
      console.error('[set-session] No session provided in request');
      return json({ error: 'No session provided' }, { status: 400 });
    }
    
    const cookieKey = 'sb-session';
    const cookieValue = encodeURIComponent(JSON.stringify(body.session));
    console.log('[set-session] Cookie being set:', {
      key: cookieKey,
      valueLength: cookieValue.length
    });
    
    // Only add Secure attribute in production
    const secureFlag = dev ? '' : '; Secure';
    
    const response = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${cookieKey}=${cookieValue}; Path=/; HttpOnly${secureFlag}; SameSite=Strict`
      }
    });
    
    console.log('[set-session] Response prepared successfully');
    return response;
  } catch (err) {
    console.error('[set-session] Error processing request:', err);
    return json({ error: err.message }, { status: 500 });
  }
}
