import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = /** @type {{ session?: unknown }} */ (await request.json());

    if (!body.session) {
      return json({ error: 'No session provided' }, { status: 400 });
    }

    const cookieKey = 'sb-session';
    const cookieValue = encodeURIComponent(JSON.stringify(body.session));

    // Only add Secure attribute in production
    const secureFlag = dev ? '' : '; Secure';

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': `${cookieKey}=${cookieValue}; Path=/; HttpOnly${secureFlag}; SameSite=Strict`
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, { status: 500 });
  }
};
